import { CollaborativeAgentSystem } from "./index";

async function runStockAnalysisExample() {
  // Initialize the system
  const system = new CollaborativeAgentSystem();

  // Register agents
  system.registerAgent({
    id: "fundamental_analyzer",
    role: "Financial Analyst",
    expertise: [
      "fundamental analysis",
      "financial statements",
      "valuation models",
    ],
    system_prompt: `You are a Financial Analyst specializing in fundamental analysis.
    You evaluate companies based on financial statements, earnings reports, P/E ratios, book value,
    and other fundamental metrics. Your expertise lies in understanding a company's intrinsic value
    and long-term prospects. You're conservative in your analyses and focus on sustainable growth
    rather than short-term market movements.`,
  });

  system.registerAgent({
    id: "technical_analyzer",
    role: "Technical Analyst",
    expertise: [
      "technical analysis",
      "chart patterns",
      "technical indicators",
      "market timing",
    ],
    system_prompt: `You are a Technical Analyst specializing in market patterns and price movements.
    You analyze stocks based on historical price data, volume, momentum indicators, support and resistance levels,
    and chart patterns. You don't concern yourself with what a company does or its fundamentals,
    but rather focus exclusively on market psychology as reflected in price action.
    You believe that all relevant information is already reflected in the price.`,
  });

  system.registerAgent({
    id: "sentiment_analyzer",
    role: "Sentiment Analyst",
    expertise: [
      "market sentiment",
      "news analysis",
      "social media trends",
      "investor psychology",
    ],
    system_prompt: `You are a Sentiment Analyst specializing in gauging market mood and investor psychology.
    You analyze news headlines, social media trends, analyst ratings, and general market sentiment.
    You understand how narratives and emotion drive short to medium-term price movements,
    and you're particularly skilled at identifying potential catalysts and shifts in market perception
    before they're fully reflected in price.`,
  });

  // Define the task
  const task = `Analyze Tesla (TSLA) stock and provide an investment recommendation for a 6-month time horizon.
  Consider recent earnings, market trends, competitive landscape, and any relevant news.
  Provide a clear buy, hold, or sell recommendation with supporting rationale.`;

  // Run the collaborative workflow
  console.log("Starting collaborative stock analysis...");
  const result = await system.runCollaborativeWorkflow(task, [
    "fundamental_analyzer",
    "technical_analyzer",
    "sentiment_analyzer",
  ]);

  // Get final execution results
  const finalResults = [];
  for (const nodeId of result.final_nodes) {
    const node = system.getNodeContent(nodeId);
    finalResults.push({
      agent: node.agent,
      final_result: node.content.final_result,
    });
  }

  console.log("Workflow complete!");
  console.log("Final results:", JSON.stringify(finalResults, null, 2));

  // Display the thought graph
  console.log("Thought Graph:", JSON.stringify(result.graph, null, 2));

  return result;
}

// Run the example
// runStockAnalysisExample()
//   .then(result => console.log("Example completed successfully"))
//   .catch(error => console.error("Error running example:", error));

async function runSecurityVulnerabilityAssessment() {
  // Initialize the system
  const system = new CollaborativeAgentSystem();

  // Register specialized security agents
  system.registerAgent({
    id: "attack_vector_specialist",
    role: "Attack Vector Specialist",
    expertise: [
      "penetration testing",
      "exploit development",
      "attack surface mapping",
    ],
    system_prompt: `You are an Attack Vector Specialist with expertise in identifying potential security vulnerabilities.
    Your approach focuses on discovering entry points and attack surfaces in systems.
    You think like an attacker, looking for the path of least resistance into a system.
    You are thorough and creative in identifying non-obvious attack vectors.
    You don't make assumptions about security controls being properly implemented.`,
  });

  system.registerAgent({
    id: "defense_specialist",
    role: "Defense Specialist",
    expertise: [
      "security architecture",
      "defense-in-depth",
      "security controls",
    ],
    system_prompt: `You are a Defense Specialist with expertise in securing systems against attacks.
    Your approach focuses on implementing robust security controls and defensive measures.
    You think about systems from a holistic security perspective, considering layers of defense.
    You are skeptical of single-point security solutions and prefer defense-in-depth approaches.
    You prioritize practical, implementable security measures over theoretical perfection.`,
  });

  system.registerAgent({
    id: "risk_assessor",
    role: "Risk Assessment Specialist",
    expertise: [
      "threat modeling",
      "risk quantification",
      "business impact analysis",
    ],
    system_prompt: `You are a Risk Assessment Specialist with expertise in evaluating security risks.
    Your approach focuses on quantifying risks and prioritizing mitigation efforts based on impact.
    You consider both likelihood and potential business impact when assessing vulnerabilities.
    You understand that not all vulnerabilities are equal and resources for remediation are limited.
    You help organizations make informed decisions about which risks to address first.`,
  });

  // Define the security assessment task
  const task = `
  Perform a security vulnerability assessment for a new cloud-based financial application with the following characteristics:

  - Handles sensitive financial data for corporate clients
  - Uses containerized microservices architecture on AWS
  - Implements OAuth 2.0 for authentication
  - Connects to third-party payment processing APIs
  - Has a web frontend and mobile applications
  - Deployed across multiple availability zones

  Identify the most critical security vulnerabilities, recommend mitigation strategies, and prioritize remediation efforts.
  `;

  // Step 1: Execute initial reasoning for each agent
  console.log("Starting initial reasoning phase...");

  const reasoningNodeIds = {
    attack: await system.executeReasoning("attack_vector_specialist", {}, task),
    defense: await system.executeReasoning("defense_specialist", {}, task),
    risk: await system.executeReasoning("risk_assessor", {}, task),
  };

  console.log("Initial reasoning complete");

  // Step 2: Each agent creates a plan based on their specialized perspective
  console.log("Starting planning phase...");

  const planNodeIds = {
    attack: await system.executePlanning(
      "attack_vector_specialist",
      [
        reasoningNodeIds.attack,
        reasoningNodeIds.defense,
        reasoningNodeIds.risk,
      ],
      task,
    ),
    defense: await system.executePlanning(
      "defense_specialist",
      [
        reasoningNodeIds.attack,
        reasoningNodeIds.defense,
        reasoningNodeIds.risk,
      ],
      task,
    ),
    risk: await system.executePlanning(
      "risk_assessor",
      [
        reasoningNodeIds.attack,
        reasoningNodeIds.defense,
        reasoningNodeIds.risk,
      ],
      task,
    ),
  };

  console.log("Planning phase complete");

  // Step 3: Adversarial validation - each agent validates another's plan
  console.log("Starting adversarial validation phase...");

  // Attack specialist validates the defense plan (finding gaps)
  const attackValidatesDefense = await system.executeValidation(
    "attack_vector_specialist",
    planNodeIds.defense,
  );

  // Defense specialist validates the attack plan (checking completeness)
  const defenseValidatesAttack = await system.executeValidation(
    "defense_specialist",
    planNodeIds.attack,
  );

  // Risk assessor validates both plans (evaluating priorities)
  const riskValidatesAttack = await system.executeValidation(
    "risk_assessor",
    planNodeIds.attack,
  );

  const riskValidatesDefense = await system.executeValidation(
    "risk_assessor",
    planNodeIds.defense,
  );

  console.log("Adversarial validation phase complete");

  // Step 4: Refinement of plans based on validation results
  console.log("Starting plan refinement phase...");

  // Each specialist refines their plan based on validation feedback
  const refinedPlanNodeIds = {
    attack: await system.executeRefinement(
      "attack_vector_specialist",
      planNodeIds.attack,
      defenseValidatesAttack,
    ),
    defense: await system.executeRefinement(
      "defense_specialist",
      planNodeIds.defense,
      attackValidatesDefense,
    ),
  };

  console.log("Plan refinement phase complete");

  // Step 5: Final validation of refined plans
  console.log("Starting final validation phase...");

  // Risk assessor validates the refined plans
  const riskValidatesRefinedAttack = await system.executeValidation(
    "risk_assessor",
    refinedPlanNodeIds.attack,
  );

  const riskValidatesRefinedDefense = await system.executeValidation(
    "risk_assessor",
    refinedPlanNodeIds.defense,
  );

  console.log("Final validation phase complete");

  // Step 6: Create integrated assessment by the risk assessor
  console.log("Creating integrated security assessment...");

  // Risk assessor creates a final integrated plan based on validated attack and defense plans
  const integratedPlanNodeId = await system.executePlanning(
    "risk_assessor",
    [refinedPlanNodeIds.attack, refinedPlanNodeIds.defense],
    `${task}

    Create an integrated security assessment that combines the attack vectors identified and the defense strategies proposed.
    Prioritize vulnerabilities based on risk level and provide a comprehensive remediation roadmap.`,
  );

  // Step 7: Execute the integrated plan
  console.log("Executing final integrated security assessment...");

  const finalAssessmentNodeId = await system.executeImplementation(
    "risk_assessor",
    integratedPlanNodeId,
  );

  console.log("Security vulnerability assessment complete!");

  // Get the final integrated assessment
  const finalNode = system.getNodeContent(finalAssessmentNodeId);
  const finalAssessment = finalNode.content;

  console.log(
    "Final Security Assessment:",
    JSON.stringify(finalAssessment, null, 2),
  );

  // Get visualization of the entire thought process
  const graphVisualization = system.getGraphVisualization();

  return {
    task,
    finalAssessment,
    graphVisualization,
  };
}
