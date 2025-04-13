import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFlexible(inputString: string, useEval = false) {
  // First, try to parse as JSON
  try {
    return JSON.parse(inputString);
  } catch (e: any) {
    console.log("Not valid JSON, attempting to convert from JS object literal...");
    
    // If it fails, the string might be a JavaScript object literal
    // Try to convert JS object literal to JSON by:
    // 1. Replace unquoted property names with quoted ones
    // 2. Replace single quotes with double quotes
    
    let processedString = inputString;
    
    // Remove leading/trailing whitespace
    processedString = processedString.trim();
    
    // Handle the case where the string is wrapped in parentheses like ({...})
    if (processedString.startsWith('(') && processedString.endsWith(')')) {
      processedString = processedString.substring(1, processedString.length - 1);
    }
    
    // Remove trailing commas (valid in JS objects but not in JSON)
    processedString = processedString.replace(/,(\s*[}\]])/g, '$1');
    
    // Replace unquoted property names with quoted ones
    // This regex matches property names at the beginning of objects or after commas
    processedString = processedString.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
    
    // Replace single quotes with double quotes
    processedString = processedString.replace(/'/g, '"');
    
    try {
      return JSON.parse(processedString);
    } catch (e2) {
      console.error("Failed to parse as converted JSON:", e2);
      
      // As a last resort, use eval if allowed
      if (useEval) {
        try {
          // Use a self-executing function with return to force object literal evaluation
          return eval('(' + inputString + ')');
        } catch (e3) {
          console.error("Failed to eval the input string:", e3);
          throw new Error("Unable to parse the input as either JSON or JavaScript object");
        }
      } else {
        throw new Error("Unable to parse the input as either JSON or JavaScript object, and eval is disabled");
      }
    }
  }
}
