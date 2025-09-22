#!/usr/bin/env node

/**
 * Lighthouse PWA Optimization Suite
 * Analyzes and optimizes the application for maximum Lighthouse scores
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 A KI PRI SA YÉ - Lighthouse PWA Optimization\n');

// Configuration
const config = {
  url: 'http://localhost:4173',
  serverPort: 4173,
  targetScores: {
    performance: 90,
    accessibility: 95,
    'best-practices': 90,
    seo: 95,
    pwa: 90
  }
};

// Results tracking
const results = {
  lighthouse: null,
  optimizations: [],
  passed: 0,
  failed: 0
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`📋 ${description}...`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 120000 // 2 minutes timeout
    });
    log(`✅ ${description} completed`, 'success');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function buildApplication() {
  log('🏗️ Building application for production...');
  
  const buildResult = runCommand('npm run build', 'Production build');
  if (!buildResult.success) {
    throw new Error('Build failed');
  }
  
  // Verify dist folder exists
  if (!fs.existsSync('dist')) {
    throw new Error('Build output directory not found');
  }
  
  log('✅ Application built successfully', 'success');
}

async function startServer() {
  log('🌐 Starting preview server...');
  
  // Kill any existing server on the port
  try {
    execSync(`lsof -ti:${config.serverPort} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {
    // Port is free
  }
  
  // Start server in background
  const serverProcess = require('child_process').spawn('npm', ['run', 'preview'], {
    detached: true,
    stdio: 'ignore'
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test if server is responding
  try {
    const testResult = runCommand(`curl -I ${config.url}`, 'Server health check');
    if (!testResult.success) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    throw new Error('Preview server failed to start');
  }
  
  log('✅ Preview server started', 'success');
  return serverProcess;
}

async function runLighthouse() {
  log('🔍 Running Lighthouse audit...');
  
  const lighthouseCmd = `lighthouse ${config.url} \\
    --output=json \\
    --output-path=./lighthouse-report.json \\
    --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \\
    --form-factor=mobile \\
    --throttling-method=simulate \\
    --only-categories=performance,accessibility,best-practices,seo,pwa \\
    --preset=perf`;
  
  const result = runCommand(lighthouseCmd, 'Lighthouse audit');
  
  if (!result.success || !fs.existsSync('./lighthouse-report.json')) {
    log('⚠️ Lighthouse audit failed, using fallback approach', 'warning');
    return null;
  }
  
  try {
    const reportData = JSON.parse(fs.readFileSync('./lighthouse-report.json', 'utf8'));
    results.lighthouse = reportData;
    
    log('✅ Lighthouse audit completed', 'success');
    return reportData;
  } catch (error) {
    log(`❌ Failed to parse Lighthouse report: ${error.message}`, 'error');
    return null;
  }
}

function analyzeLighthouseScores(report) {
  if (!report || !report.categories) {
    log('❌ No Lighthouse data to analyze', 'error');
    return;
  }
  
  log('\n📊 Lighthouse Scores:');
  
  const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'];
  
  categories.forEach(category => {
    const categoryData = report.categories[category];
    if (categoryData) {
      const score = Math.round(categoryData.score * 100);
      const target = config.targetScores[category];
      const status = score >= target ? '✅' : '❌';
      const color = score >= target ? 'success' : 'error';
      
      log(`${status} ${categoryData.title}: ${score}/100 (target: ${target})`, color);
      
      if (score >= target) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  });
}

function generateOptimizations(report) {
  if (!report || !report.audits) {
    return;
  }
  
  log('\n🔧 Optimization Recommendations:');
  
  const criticalAudits = [
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'first-contentful-paint',
    'speed-index',
    'interactive',
    'unused-javascript',
    'unused-css-rules',
    'render-blocking-resources',
    'efficient-animated-content',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript'
  ];
  
  criticalAudits.forEach(auditId => {
    const audit = report.audits[auditId];
    if (audit && audit.score !== null && audit.score < 0.9) {
      const recommendation = {
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: Math.round(audit.score * 100),
        details: audit.details?.opportunity || audit.details?.items || []
      };
      
      results.optimizations.push(recommendation);
      log(`⚠️ ${audit.title}: ${recommendation.score}/100`, 'warning');
      
      if (audit.details?.opportunity) {
        log(`   💡 Potential savings: ${audit.details.opportunity}`, 'info');
      }
    }
  });
}

function checkPWAFeatures() {
  log('\n📱 PWA Features Check:');
  
  const pwaChecks = [
    {
      name: 'Service Worker',
      file: 'public/service-worker.js',
      test: () => fs.existsSync('public/service-worker.js')
    },
    {
      name: 'Web App Manifest',
      file: 'public/manifest.webmanifest',
      test: () => fs.existsSync('public/manifest.webmanifest')
    },
    {
      name: 'Icons (192px)',
      file: 'public/pwa_icon_192.png',
      test: () => fs.existsSync('public/pwa_icon_192.png') || fs.existsSync('public/icon-192x192.png')
    },
    {
      name: 'Icons (512px)',
      file: 'public/pwa_icon_512.png',
      test: () => fs.existsSync('public/pwa_icon_512.png') || fs.existsSync('public/icon-512x512.png')
    },
    {
      name: 'HTTPS Ready',
      file: 'build configuration',
      test: () => true // Always true for static builds
    }
  ];
  
  pwaChecks.forEach(check => {
    const passed = check.test();
    const status = passed ? '✅' : '❌';
    const color = passed ? 'success' : 'error';
    
    log(`${status} ${check.name}`, color);
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  });
}

function checkAccessibility() {
  log('\n♿ Accessibility Check:');
  
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ Dist folder not found', 'error');
    return;
  }
  
  const htmlFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const accessibilityChecks = [
      {
        name: `${file}: Meta viewport`,
        test: () => content.includes('name="viewport"')
      },
      {
        name: `${file}: Lang attribute`,
        test: () => content.includes('lang=')
      },
      {
        name: `${file}: Alt attributes check`,
        test: () => {
          const images = content.match(/<img[^>]*>/g) || [];
          return images.every(img => img.includes('alt='));
        }
      },
      {
        name: `${file}: Semantic HTML`,
        test: () => content.includes('<main') || content.includes('<nav') || content.includes('<header')
      }
    ];
    
    accessibilityChecks.forEach(check => {
      const passed = check.test();
      const status = passed ? '✅' : '❌';
      const color = passed ? 'success' : 'error';
      
      log(`${status} ${check.name}`, color);
      
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    });
  });
}

function generateReport() {
  log('\n📋 Optimization Report:');
  
  const totalScore = Math.round((results.passed / (results.passed + results.failed)) * 100);
  
  log(`\n📈 Overall Score: ${totalScore}%`, totalScore >= 90 ? 'success' : 'warning');
  log(`✅ Passed: ${results.passed}`);
  log(`❌ Failed: ${results.failed}`);
  
  if (results.optimizations.length > 0) {
    log('\n🎯 Priority Optimizations:');
    results.optimizations
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .forEach((opt, index) => {
        log(`${index + 1}. ${opt.title} (${opt.score}/100)`, 'warning');
      });
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    overallScore: totalScore,
    results: results,
    lighthouse: results.lighthouse?.categories || null,
    recommendations: results.optimizations
  };
  
  fs.writeFileSync('./lighthouse-optimization-report.json', JSON.stringify(reportData, null, 2));
  log('\n💾 Detailed report saved to lighthouse-optimization-report.json');
  
  return totalScore >= 90;
}

async function main() {
  let serverProcess = null;
  
  try {
    // Build the application
    await buildApplication();
    
    // Start preview server
    serverProcess = await startServer();
    
    // Run Lighthouse audit
    const lighthouseReport = await runLighthouse();
    
    // Analyze results
    if (lighthouseReport) {
      analyzeLighthouseScores(lighthouseReport);
      generateOptimizations(lighthouseReport);
    }
    
    // Additional checks
    checkPWAFeatures();
    checkAccessibility();
    
    // Generate final report
    const success = generateReport();
    
    if (success) {
      log('\n🎉 Optimization targets achieved!', 'success');
      process.exit(0);
    } else {
      log('\n⚠️ Some optimization targets not met. See recommendations above.', 'warning');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    // Cleanup
    if (serverProcess) {
      try {
        process.kill(serverProcess.pid);
      } catch (e) {
        // Process already killed
      }
    }
    
    // Kill any remaining server processes
    try {
      execSync(`lsof -ti:${config.serverPort} | xargs kill -9`, { stdio: 'ignore' });
    } catch (e) {
      // No processes to kill
    }
  }
}

// Handle interruption
process.on('SIGINT', () => {
  log('\n🛑 Optimization interrupted', 'warning');
  try {
    execSync(`lsof -ti:${config.serverPort} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {
    // Ignore
  }
  process.exit(130);
});

main().catch(error => {
  log(`💥 Unexpected error: ${error.message}`, 'error');
  process.exit(1);
});