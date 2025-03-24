#!/usr/bin/env node

/**
 * Update Cursor Script
 * 
 * This script automatically updates the cursor-updates.md file with information
 * about recent changes to the codebase. It's meant to be run after significant
 * changes or at the end of a development session.
 */

const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');
const readline = require('readline');

// Configuration
const CURSOR_UPDATES_FILE = path.join(process.cwd(), 'cursor-updates.md');
const DATE_FORMAT_OPTIONS = { year: 'numeric', month: '2-digit', day: '2-digit' };

/**
 * Get recent git changes
 * @returns {Promise<string>} Recent git changes
 */
async function getRecentChanges() {
  return new Promise((resolve, reject) => {
    exec('git log -n 10 --pretty=format:"%h - %an, %ar : %s" --name-status', (error, stdout, stderr) => {
      if (error) {
        console.warn('Git not available or not a git repository. Using manual input instead.');
        resolve(null);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Get list of files changed from git output
 * @param {string} gitOutput Git log output
 * @returns {Array<string>} List of changed files
 */
function extractChangedFiles(gitOutput) {
  if (!gitOutput) return [];
  
  const files = new Set();
  const lines = gitOutput.split('\n');
  
  for (const line of lines) {
    // Match lines with file changes (A, M, D followed by a filename)
    const match = line.match(/^[AMD]\s+(.+)$/);
    if (match && match[1]) {
      files.add(match[1]);
    }
  }
  
  return Array.from(files);
}

/**
 * Get current date formatted as YYYY-MM-DD
 * @returns {string} Formatted date
 */
function getCurrentDate() {
  const today = new Date();
  return today.toLocaleDateString('en-CA', DATE_FORMAT_OPTIONS).replace(/\//g, '-');
}

/**
 * Create an interactive readline interface
 * @returns {readline.Interface} Readline interface
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 * @param {readline.Interface} rl Readline interface
 * @param {string} question Question to ask
 * @returns {Promise<string>} User input
 */
async function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Update the cursor-updates.md file with new entry
 * @param {string} title Entry title
 * @param {string} description Entry description
 * @param {Array<string>} files Files changed
 * @param {string} notes Additional notes
 */
async function updateCursorFile(title, description, files, notes) {
  try {
    // Read the current file content
    let content = '';
    try {
      content = await fs.readFile(CURSOR_UPDATES_FILE, 'utf8');
    } catch (e) {
      // File doesn't exist yet, create it with a header
      content = `# Cursor Updates Log\n\nThis file tracks significant changes to the Codebase Visualizer project.\n\n## Updates\n\n`;
    }

    // Create the new entry
    const date = getCurrentDate();
    const entry = `### ${date}\n\n#### ${title}\n${description}\n\n**Files:**\n${files.map(f => `- ${f}`).join('\n')}\n\n**Notes:**\n${notes}\n\n---\n\n`;
    
    // Find the position to insert (after the ## Updates heading)
    const updatesPos = content.indexOf('## Updates');
    
    if (updatesPos !== -1) {
      // Find the position after the heading
      const insertPos = content.indexOf('\n', updatesPos) + 1;
      
      // Insert the new entry
      const newContent = content.slice(0, insertPos) + entry + content.slice(insertPos);
      await fs.writeFile(CURSOR_UPDATES_FILE, newContent, 'utf8');
    } else {
      // If the file structure is different, just append to the file
      await fs.appendFile(CURSOR_UPDATES_FILE, entry, 'utf8');
    }
    
    console.log(`✅ Successfully updated ${CURSOR_UPDATES_FILE}`);
  } catch (error) {
    console.error(`❌ Error updating cursor updates file: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  const rl = createInterface();
  
  try {
    // Get git changes if available
    const recentChanges = await getRecentChanges();
    let changedFiles = recentChanges ? extractChangedFiles(recentChanges) : [];
    
    console.log('📝 Updating Cursor Updates Log');
    
    // Get update information from user
    const title = await prompt(rl, 'Enter update title: ');
    
    // Show the detected files and allow editing
    if (changedFiles.length > 0) {
      console.log('\nDetected changed files:');
      changedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });
      
      const editFiles = await prompt(rl, 'Edit the file list? (y/n): ');
      if (editFiles.toLowerCase() === 'y') {
        const fileList = await prompt(rl, 'Enter comma-separated list of files: ');
        changedFiles = fileList.split(',').map(f => f.trim()).filter(f => f);
      }
    } else {
      const fileList = await prompt(rl, 'Enter comma-separated list of files: ');
      changedFiles = fileList.split(',').map(f => f.trim()).filter(f => f);
    }
    
    console.log('\nEnter description (multi-line, end with a single dot "." on its own line):');
    let description = '';
    let line;
    while ((line = await prompt(rl, '')) !== '.') {
      description += `- ${line}\n`;
    }
    
    const notes = await prompt(rl, 'Enter additional notes: ');
    
    // Update the file
    await updateCursorFile(title, description, changedFiles, notes);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the script
main(); 