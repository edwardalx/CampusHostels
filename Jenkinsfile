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
        
        stage('Build Frontend') {
            options {
                timeout(time: 20, unit: 'MINUTES')
            }
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔨 Building Frontend on server..."
                        
                        ssh -o ConnectTimeout=60 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e
                            echo "=== Starting Frontend Build at \$(date) ==="
                            
                            cd \${env.PROJECT_DIR}
                            
                            echo "📦 Pulling latest code..."
                            git stash || true
                            git pull origin main
                            
                            cd \${env.FRONTEND_DIR}
                            echo "📁 Working directory: \$(pwd)"
                            
                            # Configure npm for better performance
                            npm config set fetch-retry-mintimeout 60000
                            npm config set fetch-retry-maxtimeout 300000
                            npm config set fetch-timeout 300000
                            
                            echo "📦 Installing dependencies..."
                            echo "Node: \$(node --version)"
                            echo "npm: \$(npm --version)"
                            
                            # Clean up previous installations if they might be corrupted
                            if [ ! -f "node_modules/.bin/vite" ]; then
                                echo "Cleaning up previous installation..."
                                rm -rf node_modules package-lock.json 2>/dev/null || true
                            fi
                            
                            # Install with retry logic
                            MAX_RETRIES=3
                            RETRY_COUNT=0
                            INSTALL_SUCCESS=false
                            
                            while [ \$RETRY_COUNT -lt \$MAX_RETRIES ] && [ "\$INSTALL_SUCCESS" = "false" ]; do
                                RETRY_COUNT=\$((RETRY_COUNT + 1))
                                echo "Install attempt \$RETRY_COUNT of \$MAX_RETRIES..."
                                
                                if npm install --no-optional --legacy-peer-deps --verbose 2>&1 | tail -50; then
                                    INSTALL_SUCCESS=true
                                    echo "✅ npm install succeeded on attempt \$RETRY_COUNT"
                                else
                                    echo "❌ npm install failed on attempt \$RETRY_COUNT"
                                    if [ \$RETRY_COUNT -lt \$MAX_RETRIES ]; then
                                        echo "Waiting 10 seconds before retry..."
                                        sleep 10
                                        echo "Cleaning up before retry..."
                                        rm -rf node_modules package-lock.json 2>/dev/null || true
                                    fi
                                fi
                            done
                            
                            if [ "\$INSTALL_SUCCESS" = "false" ]; then
                                echo "❌ All npm install attempts failed!"
                                exit 1
                            fi
                            
                            # Verify vite is installed
                            if [ ! -f "node_modules/.bin/vite" ]; then
                                echo "❌ ERROR: Vite not found after installation!"
                                echo "Checking node_modules/.bin:"
                                ls -la node_modules/.bin/ 2>/dev/null || echo "No node_modules/.bin directory"
                                exit 1
                            fi
                            
                            echo "✅ Dependencies installed successfully"
                            echo "Vite version: \$(./node_modules/.bin/vite --version)"
                            
                            echo "🔨 Building frontend..."
                            if npm run build; then
                                echo "✅ Build completed successfully!"
                            else
                                echo "❌ Build failed!"
                                exit 1
                            fi
                            
                            # Verify build output
                            if [ -f "dist/index.html" ]; then
                                echo "✅ Build verification passed"
                                echo "Build output: \$(ls -la dist/ | wc -l) files"
                                echo "Main file: dist/index.html"
                            else
                                echo "❌ ERROR: dist/index.html not found!"
                                ls -la dist/ 2>/dev/null || echo "No dist directory"
                                exit 1
                            fi
                            
                            echo "=== Build completed at \$(date) ==="
                        '
                    """
                }
            }
        }

        stage('Deploy to Production') {
            options {
                timeout(time: 15, unit: 'MINUTES')
            }
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🚀 Deploying application..."
                        
                        ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e
                            echo "=== Starting Deployment at \$(date) ==="
                            
                            cd \${env.PROJECT_DIR}
                            
                            # Verify frontend build exists
                            if [ ! -f "\${env.FRONTEND_DIR}/dist/index.html" ]; then
                                echo "❌ ERROR: Frontend build not found!"
                                echo "Expected: \${env.FRONTEND_DIR}/dist/index.html"
                                exit 1
                            fi
                            
                            echo "✅ Frontend build verified"
                            echo "Build timestamp: \$(stat -c %y \${env.FRONTEND_DIR}/dist/index.html)"
                            
                            # Check Docker Compose status
                            echo "Checking Docker Compose..."
                            if [ -f "docker-compose.yml" ] || [ -f "compose.yaml" ]; then
                                echo "Docker Compose file found"
                            else
                                echo "⚠️ No Docker Compose file found in \$(pwd)"
                            fi
                            
                            # Stop existing services
                            echo "Stopping existing containers..."
                            docker compose down 2>/dev/null || echo "No containers to stop"
                            
                            # Rebuild and start
                            echo "Building and starting containers..."
                            docker compose build --no-cache 2>&1 | tail -50
                            docker compose up -d
                            
                            echo "⏳ Waiting for services to start (40 seconds)..."
                            sleep 40
                            
                            # Verify services
                            echo "=== Service Status ==="
                            docker compose ps
                            
                            echo ""
                            echo "=== Quick Health Check ==="
                            echo "Containers running: \$(docker compose ps --services --filter 'status=running' | wc -l)"
                            echo "Containers total: \$(docker compose ps --services | wc -l)"
                            
                            # Check frontend in nginx
                            echo ""
                            echo "=== Frontend in Nginx ==="
                            if docker ps | grep -q nginx; then
                                echo "Nginx container is running"
                                docker exec \$(docker ps -q --filter name=nginx) ls -la /var/www/html/ 2>/dev/null || echo "Cannot check nginx files"
                            else
                                echo "Nginx container not found"
                            fi
                            
                            echo ""
                            echo "✅ Deployment completed successfully at \$(date)"
                            echo ""
                            echo "🌐 Application URLs:"
                            echo "   • Frontend: https://campushostels.duckdns.org/"
                            echo "   • Django Admin: https://campushostels.duckdns.org/admin/"
                            echo "   • .NET API: https://campushostels.duckdns.org/api/"
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            echo "📊 Build and deployment process completed"
        }
        success {
            echo "✅ SUCCESS: Frontend built and deployed!"
            echo "📢 Note: Users may need to clear browser cache (Ctrl+Shift+R) to see updates"
        }
        failure {
            echo "❌ FAILURE: Build or deployment failed"
            
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh """
                    echo "=== Debug Information ==="
                    ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                        echo "=== Server Debug Info ==="
                        echo "Time: \$(date)"
                        echo "Uptime: \$(uptime)"
                        
                        echo ""
                        echo "=== Frontend Status ==="
                        cd \${env.PROJECT_DIR}/\${env.FRONTEND_DIR} 2>/dev/null && {
                            echo "Directory: \$(pwd)"
                            echo "Files:"
                            ls -la | head -15
                            
                            echo ""
                            echo "=== node_modules status ==="
                            if [ -d "node_modules" ]; then
                                echo "node_modules exists (\$(du -sh node_modules | cut -f1))"
                                ls -la node_modules/.bin/vite 2>/dev/null && echo "✅ Vite found" || echo "❌ Vite not found"
                            else
                                echo "❌ node_modules directory missing"
                            fi
                            
                            echo ""
                            echo "=== Build status ==="
                            if [ -d "dist" ]; then
                                echo "dist directory exists"
                                ls -la dist/ | head -10
                            else
                                echo "❌ dist directory missing"
                            fi
                        } || echo "Cannot access frontend directory"
                        
                        echo ""
                        echo "=== Docker Status ==="
                        docker ps -a 2>/dev/null | head -20 || echo "Docker not available"
                        
                        echo ""
                        echo "=== Disk Space ==="
                        df -h . 2>/dev/null || true
                        
                        echo ""
                        echo "=== npm cache ==="
                        npm cache verify 2>/dev/null | tail -5 || echo "npm cache check failed"
                    '
                """
            }
        }
    }
}