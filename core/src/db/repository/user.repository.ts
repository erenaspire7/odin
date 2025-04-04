import { User } from "@odin/core/db";
import { EntityRepository } from "@mikro-orm/postgresql";
import { RegisterUserPayload } from "@odin/core/types";

export class UserRepository extends EntityRepository<User> {
  createUser(input: RegisterUserPayload) {
    const { walletAddress } = input;
    const user = new User(walletAddress);
    this.getEntityManager().persist(user);

    return user;
  }
}
