import { initMikroORM } from "@odin/core/db";
import { DatasetService } from "./index";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChainOfThoughtSchema } from "@odin/core/types";
import { z } from "zod";

const dataset = [
  `Sentiment Analysis for Product Reviews
  Scenario: An e-commerce platform needs to analyze thousands of customer reviews to understand sentiment trends across different product categories.
  Chain of Thought:

  First, I need to collect all relevant product reviews from our database, ensuring they're properly categorized by product type.
  I'll preprocess the text data by removing stopwords, punctuation, and normalizing case.
  For each review, I'll apply sentiment analysis models to classify the text as positive, negative, or neutral.
  I'll identify key sentiment drivers by extracting frequent phrases and topics associated with strong sentiment scores.
  I'll aggregate the results by product category to identify trends and outliers.
  I should cross-reference sentiment shifts with product updates or market events to establish potential causality.
  Finally, I'll generate visualizations and summary reports highlighting actionable insights for product teams.`,
  `Predictive Maintenance for Manufacturing Equipment
  Scenario: A factory needs to predict when critical machinery might fail to prevent costly downtime.
  Chain of Thought:
  I need to gather historical sensor data from all machines, including temperature, vibration, pressure, and operational parameters.
  I'll clean and normalize this time-series data, addressing missing values and outliers.
  I should identify patterns that preceded previous failures, looking for subtle deviations from normal operation.
  I'll develop a model that can recognize these early warning signs, incorporating both immediate readings and longer-term degradation patterns.
  I need to establish appropriate prediction thresholds that balance the cost of false positives against the risk of missing actual failures.
  I'll create a real-time monitoring system that alerts maintenance teams when a machine exhibits concerning patterns.
  The system should prioritize alerts based on predicted time-to-failure and the criticality of each machine to operations.`,
  `Personalized Content Recommendation
  Scenario: A streaming service wants to recommend content that will maximize user engagement and retention.
  Chain of Thought:

  I need to analyze each user's viewing history, including what they watched, when they watched it, and how much they watched.
  I should incorporate explicit feedback (ratings, likes) and implicit feedback (completion rates, rewatch behavior).
  I'll identify content clusters based on genre, creator, themes, and other metadata.
  For new users with limited history, I'll rely on demographic similarities and popular content within their chosen interests.
  For established users, I'll balance recommending similar content they'll likely enjoy with diverse suggestions to prevent content bubbles.
  I need to consider contextual factors like time of day, device, and seasonal trends when making recommendations.
  I'll continuously update recommendations based on real-time feedback, prioritizing recent behavior over historical patterns.`,
  `Fraud Detection in Financial Transactions
  Scenario: A bank needs to identify potentially fraudulent transactions while minimizing false positives that inconvenience legitimate customers.
  Chain of Thought:

  I need to establish a baseline of normal transaction patterns for each customer, considering variables like typical transaction amounts, locations, merchants, and timing.
  I'll identify potential red flags: transactions in unusual locations, unusual spending amounts, multiple transactions in quick succession, or purchases from high-risk merchants.
  I should calculate a risk score for each transaction based on deviation from established patterns and known fraud indicators.
  For borderline cases, I need to consider the customer's history, account age, and previous false alerts.
  If a transaction exceeds certain risk thresholds, I'll trigger appropriate verification steps based on transaction value and customer preferences.
  After each verification, I'll update the customer's behavior profile to reduce future false positives.
  I should continuously refine the model based on confirmed fraud cases and false positives to improve detection accuracy.`,
  `
  Supply Chain Optimization
 Scenario: A retail company wants to optimize inventory levels across multiple warehouses to minimize costs while ensuring product availability.
 Chain of Thought:

 I need to analyze historical sales data across all locations, identifying seasonal patterns and trends for each product category.
 I'll incorporate external factors like weather forecasts, upcoming holidays, and planned marketing campaigns that might affect demand.
 I should consider supply constraints, including lead times from different suppliers and production limitations.
 I'll model the tradeoffs between inventory holding costs, transportation costs, and the cost of stockouts.
 For each product and location, I need to calculate optimal reorder points and quantities that minimize total costs.
 I should simulate various demand scenarios to ensure my recommendations are robust against uncertainty.
 Finally, I'll provide actionable inventory recommendations for each warehouse, with justifications and confidence intervals.`,
  `
 Medical Diagnosis Assistance
 Scenario: A healthcare system wants to help doctors identify potential diagnoses based on patient symptoms, test results, and medical history.
 Chain of Thought:

 I need to analyze the patient's presented symptoms, noting their duration, severity, and progression.
 I should incorporate relevant medical history, including chronic conditions, previous similar episodes, and family history.
 I'll review available test results, identifying any values outside normal ranges or concerning patterns.
 I need to compare this clinical picture against a comprehensive database of conditions and their typical presentations.
 For each potential diagnosis, I'll calculate a probability based on symptom match, prevalence, and patient risk factors.
 I should identify what additional tests or information would most effectively narrow down the possibilities.
 I'll present the most likely diagnoses to the physician, along with supporting evidence and suggested next steps for confirmation.`,
  `Dynamic Pricing Optimization
 Scenario: An airline wants to maximize revenue by adjusting ticket prices based on demand, competition, and other factors.
 Chain of Thought:

 I need to analyze historical booking patterns for each route, identifying how demand varies by day of week, time of year, and proximity to departure.
 I should monitor competitor pricing in real-time to understand the current market position.
 I'll incorporate external factors like major events at destination cities, weather forecasts, and fuel price trends.
 For each flight, I need to predict remaining demand at various potential price points.
 I should model different pricing strategies, calculating expected revenue under different scenarios.
 I need to balance short-term revenue maximization with long-term customer loyalty and market share considerations.
 Based on all these factors, I'll recommend optimal price adjustments for each route and departure time.`,
  `
 Anomaly Detection in Network Security
Scenario: A cybersecurity team needs to identify potential security breaches by detecting unusual patterns in network traffic.
Chain of Thought:

I need to establish baseline patterns for normal network activity, including typical data volumes, access patterns, and communication protocols.
I should segment this baseline by time of day, day of week, and user groups to account for legitimate variations.
I'll continuously monitor real-time network traffic, looking for deviations from established patterns.
When an anomaly is detected, I need to classify its nature - is it unusual volume, unusual destinations, unusual protocols, or unusual timing?
I should correlate this anomaly with other recent events to identify potential attack patterns or false positives.
Based on the type and severity of the anomaly, I'll assign a risk score and prioritize for investigation.
For high-risk anomalies, I'll trigger appropriate security responses while continuing to monitor for related activity.
 `,
  `
 Personalized Education Content Sequencing
 Scenario: An online learning platform wants to deliver customized learning paths that optimize knowledge retention and student engagement.
 Chain of Thought:

 I need to assess each student's current knowledge level through diagnostic assessments and prior performance.
 I should identify knowledge gaps and learning goals based on the student's chosen course or curriculum.
 I'll analyze the student's learning style and preferences based on past interactions with different content formats.
 For each potential next topic, I'll calculate a priority score based on prerequisites, knowledge gaps, and curriculum progression.
 I need to determine optimal content difficulty - challenging enough to promote growth but not so difficult as to cause frustration.
 I should incorporate spaced repetition principles, scheduling reviews of previously learned material at optimal intervals.
 Based on real-time feedback and assessment results, I'll continuously adapt the learning sequence to maximize comprehension and engagement.`,
];

const main = async () => {
  const orm = await initMikroORM();
  const entityManager = orm.em.fork();

  const datasetService = new DatasetService(entityManager);

  // await datasetService.createDataset(
  //   "Chain-Of-Thought Paradigms v2",
  //   zodToJsonSchema(
  //     ChainOfThoughtSchema.extend({
  //       taskDescription: z.string(),
  //     }),
  //   ),
  //   "Dataset for storing Graph-like representations of Chain-of-Thoughts",
  // );

  await datasetService.logDelta(
    "56f03864-189e-11f0-84c2-233ed08ea869",
    dataset.slice(0, 1),
  );
};

main();
