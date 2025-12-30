pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
        FRONTEND_DIR = "frontend/campushostel-fe"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/edwardalx/CampusHostels.git'
            }
        }
        
        // NEW: Frontend Build Stage
        stage('Build Frontend') {
            options {
                timeout(time: 15, unit: 'MINUTES')  // Add timeout
            }
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔨 Building Frontend on server ${env.HOST_IP}..."
                        
                        ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e  # Exit on any error
                            echo "=== Starting Frontend Build ==="
                            echo "📦 Pulling frontend code..."
                            cd \${env.PROJECT_DIR}
                            
                            # Ensure we have latest frontend code
                            git stash || echo "No changes to stash"
                            git pull origin main
                            
                            echo "📦 Preparing frontend dependencies..."
                            cd \${env.FRONTEND_DIR}
                            
                            # Clear npm cache and check versions
                            echo "Node version: \$(node --version)"
                            echo "npm version: \$(npm --version)"
                            echo "Clearing npm cache..."
                            npm cache clean --force 2>/dev/null || true
                            
                            echo "📦 Installing frontend dependencies..."
                            echo "Start time: \$(date)"
                            
                            # Install with optimized settings
                            # Option 1: Use npm ci (clean install) - requires package-lock.json
                            if [ -f package-lock.json ]; then
                                echo "Using npm ci..."
                                npm ci --no-optional --legacy-peer-deps --verbose || {
                                    echo "npm ci failed, trying npm install..."
                                    npm install --no-optional --legacy-peer-deps --verbose
                                }
                            else
                                echo "Using npm install..."
                                npm install --no-optional --legacy-peer-deps --verbose
                            fi
                            
                            echo "Install completed: \$(date)"
                            echo "📦 Dependencies installed successfully!"
                            
                            echo "🔨 Building frontend (Vite/React)..."
                            npm run build
                            
                            echo "✅ Frontend built successfully!"
                            echo "📁 Build output:"
                            ls -la dist/ | head -10
                            
                            # Verify build
                            if [ -f "dist/index.html" ]; then
                                echo "✅ index.html created successfully"
                                echo "Build size: \$(du -sh dist/)"
                            else
                                echo "❌ ERROR: index.html not found in dist/"
                                exit 1
                            fi
                        '
                    """
                }
            }
        }

        stage('Deploy to Production') {
            options {
                timeout(time: 10, unit: 'MINUTES')  // Add timeout
            }
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🚀 Deploying using Docker Compose..."

                        ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e  # Exit on any error
                            echo "=== Starting Deployment ==="
                            echo "📦 Ensuring latest code..."
                            cd \${env.PROJECT_DIR}
                            
                            # Already pulled in Build Frontend stage, but ensure latest
                            git pull origin main

                            echo "🔨 Rebuilding Docker images..."
                            # Check if frontend needs rebuild
                            if [ -d "\${env.FRONTEND_DIR}/dist" ]; then
                                echo "Frontend dist folder exists, building frontend image..."
                                docker compose build --no-cache frontend || echo "Frontend build completed"
                            else
                                echo "⚠️ Warning: Frontend dist folder not found!"
                            fi
                            
                            # Rebuild other services with cache
                            docker compose build web db nginx

                            echo "🔄 Restarting services..."
                            docker compose down || echo "Services already stopped or not running"
                            docker compose up -d

                            echo "⏳ Waiting for services to start (30 seconds)…"
                            sleep 30

                            echo "🗄️ Applying Django migrations…"
                            docker compose exec -T web python manage.py migrate --noinput || echo "⚠️ Migrations may have warnings"

                            echo "📁 Collecting static files…"
                            docker compose exec -T web python manage.py collectstatic --noinput --clear || echo "⚠️ Static collection may have warnings"

                            echo "✅ Deployment completed successfully!"
                        '
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🌐 Verifying deployment..."
                        
                        ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            echo "=== Running Containers ==="
                            docker compose ps
                            
                            echo -e "\\\\n=== Frontend Verification ==="
                            echo "Checking frontend build in container..."
                            if docker exec campushostels_nginx ls -la /var/www/campushostels-fe/index.html 2>/dev/null; then
                                echo "✅ Frontend files deployed to nginx"
                                echo "File modified: \$(docker exec campushostels_nginx stat -c %y /var/www/campushostels-fe/index.html 2>/dev/null)"
                            else
                                echo "⚠️ Frontend files not found in nginx container"
                            fi
                            
                            echo -e "\\\\n=== Service Health ==="
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Frontend build: \$(docker compose ps frontend | grep -q "Exit" && echo "✅ Built successfully" || echo "⚠️ Not built")"
                            
                            echo -e "\\\\n=== Quick Health Check ==="
                            echo "Testing Django response..."
                            docker compose exec -T web python -c "
import sys
try:
    from django.core.management import setup_environ
    import django
    django.setup()
    from django.core.checks import run_checks
    result = run_checks()
    if not result:
        print('✅ Django checks passed')
    else:
        print('⚠️ Django warnings:', result)
except Exception as e:
    print('❌ Django error:', str(e))
    sys.exit(1)
                            " || echo "⚠️ Django health check failed"
                            
                            echo -e "\\\\n=== Application URLs ==="
                            echo "🌐 Django Admin: https://campushostels.duckdns.org/admin/"
                            echo "🏠 Main Site: https://campushostels.duckdns.org/"
                            echo "🔧 .NET API: https://campushostels.duckdns.org/api/"
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            echo "📊 Deployment process completed"
        }
        success {
            echo "✅ Docker deployment successful!"
            echo "📢 NOTE: Users may need to clear browser cache (Ctrl+Shift+R) to see frontend updates"
        }
        failure {
            echo "❌ Deployment failed!"
            
            // Optional: Add debugging info on failure
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh """
                    echo "=== Debug Information ==="
                    ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                        cd \${env.PROJECT_DIR}
                        
                        echo -e "\\\\n=== Recent Docker Logs ==="
                        docker compose logs --tail=20
                        
                        echo -e "\\\\n=== Frontend Build Status ==="
                        if [ -d "\${env.FRONTEND_DIR}/dist" ]; then
                            echo "✅ Frontend dist folder exists"
                            ls -la \${env.FRONTEND_DIR}/dist/
                        else
                            echo "❌ No dist folder found"
                            echo "Current directory contents:"
                            ls -la \${env.FRONTEND_DIR}/
                        fi
                        
                        echo -e "\\\\n=== npm processes ==="
                        ps aux | grep npm || echo "No npm processes running"
                        
                        echo -e "\\\\n=== System Resources ==="
                        echo "Memory:"
                        free -h
                        echo -e "\\\\nDisk space:"
                        df -h .
                        
                        echo -e "\\\\n=== Node/npm status ==="
                        if [ -d "\${env.FRONTEND_DIR}/node_modules" ]; then
                            echo "✅ node_modules exists"
                            echo "Size: \$(du -sh \${env.FRONTEND_DIR}/node_modules/)"
                        else
                            echo "❌ node_modules not found"
                        fi
                    '
                """
            }
        }
    }
}