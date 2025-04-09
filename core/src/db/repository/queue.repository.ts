import { QueueJob } from "@odin/core/db";
import { EntityRepository, LockMode, Transactional } from "@mikro-orm/postgresql";
import { JobType, JobStatus, QueueJobPayload } from "@odin/core/types";

export class QueueRepository extends EntityRepository<QueueJob> {
  MAX_ATTEMPTS = 3;

  async enqueue(jobPayload: QueueJobPayload) {
    const { type, payload, options } = jobPayload;
    const { nextJobId, priority = 0, maxAttempts = 3 } = options;

    const job = new QueueJob(type, payload, nextJobId, priority, maxAttempts);

    await this.getEntityManager().persistAndFlush(job);

    return job;
  }

  async enqueueBatch(jobsPayload: QueueJobPayload[]) {
    const jobs = jobsPayload.map(({ type, payload, options }) => {
      const { nextJobId, priority = 0, maxAttempts = 3 } = options;
      return new QueueJob(type, payload, nextJobId, priority, maxAttempts);
    });

    await this.getEntityManager().persistAndFlush(jobs);

    return jobs;
  }

  async createJobChain(jobsPayload: QueueJobPayload[]) {
    const jobs = await this.enqueueBatch(jobsPayload);

    for (let i = 0; i < jobs.length - 1; i++) {
      jobs[i].nextJobId = jobs[i + 1].id;
    }

    await this.getEntityManager().persistAndFlush(jobs);

    return jobs;
  }

  @Transactional()
  async getNextJob(types?: JobType[], lockTimeSeconds = 60) {
    const em = this.getEntityManager();

    const job = await em.findOne(
      QueueJob,
      {
        status: JobStatus.PENDING,
        attempts: { $lte: this.MAX_ATTEMPTS },
        $or: [
          {
            lockedUntil: null,
          },
          {
            lockedUntil: {
              $lte: new Date(),
            },
          },
        ],
        ...(types && types.length > 0 && { type: { $in: types } }),
      },
      {
        orderBy: {
          priority: "DESC",
          createdAt: "ASC",
        },
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      },
    );

    if (job) {
      job.status = JobStatus.PROCESSING;
      job.attempts += 1;
      job.lockedUntil = new Date(Date.now() + lockTimeSeconds * 1000);

      await em.persistAndFlush(job);
    }

    return job;
  }

  async completeJob(job: QueueJob, result?: any): Promise<void> {
    job.status = JobStatus.COMPLETED;
    job.lockedUntil = undefined;
    job.result = result;

    await this.getEntityManager().persistAndFlush(job);

    // If this job has a next job in the chain, make sure it's pending
    if (job.nextJobId) {
      const nextJob = await this.findOne({ id: job.nextJobId });
      if (nextJob) {
        nextJob.status = JobStatus.PENDING;
        await this.getEntityManager().persistAndFlush(nextJob);
      }
    }
  }

  async failJob(job: QueueJob, error?: Error | string) {
    if (job.attempts >= job.maxAttempts) {
      job.status = JobStatus.FAILED;
      job.lastError = error instanceof Error ? error.message : error;
    } else {
      // Return to pending for another attempt
      job.status = JobStatus.PENDING;
    }

    job.lockedUntil = undefined;
    await this.getEntityManager().persistAndFlush(job);
  }

  async releaseJob(job: QueueJob) {
    job.status = JobStatus.PENDING;
    job.lockedUntil = undefined;
    await this.getEntityManager().persistAndFlush(job);
  }

  async cleanupOldJobs(daysToKeep = 7) {
    const em = this.getEntityManager();

    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const items = await em.find(QueueJob, {
      status: { $in: [JobStatus.FAILED, JobStatus.COMPLETED] },
      updatedAt: { $lte: cutoffDate },
    });

    const deletedCount = em.remove(items);

    return deletedCount;
  }
}
