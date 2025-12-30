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
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔨 Building Frontend..."
                        
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e
                            echo "=== Building Frontend at \$(date) ==="
                            
                            cd \${env.PROJECT_DIR}
                            
                            echo "📦 Pulling latest code..."
                            git stash || true
                            git pull origin main
                            
                            echo "📦 Installing frontend dependencies..."
                            cd \${env.FRONTEND_DIR}
                            npm install --no-optional --legacy-peer-deps
                            
                            echo "🔨 Building frontend..."
                            npm run build
                            
                            # Verify build
                            if [ -f "dist/index.html" ]; then
                                echo "✅ Frontend build successful!"
                                echo "Build size: \$(du -sh dist/)"
                            else
                                echo "❌ Frontend build failed!"
                                exit 1
                            fi
                            
                            echo "=== Frontend build completed at \$(date) ==="
                        '
                    """
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🚀 Deploying using Docker Compose..."

                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e
                            echo "=== Starting Deployment ==="
                            
                            cd \${env.PROJECT_DIR}
                            
                            # Verify frontend build exists
                            if [ ! -f "\${env.FRONTEND_DIR}/dist/index.html" ]; then
                                echo "❌ ERROR: Frontend build not found!"
                                echo "Expected: \${env.FRONTEND_DIR}/dist/index.html"
                                exit 1
                            fi
                            
                            echo "✅ Frontend build verified"
                            
                            echo "🔨 Rebuilding images (including frontend)..."
                            # Force rebuild frontend to pick up new build
                            docker compose build --no-cache frontend
                            # Rebuild other services normally
                            docker compose build

                            echo "🔄 Restarting services..."
                            docker compose down
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
                        
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            echo "=== Running Containers ==="
                            docker compose ps
                            
                            echo -e "\\\\n=== Frontend Verification ==="
                            echo "Checking frontend files in nginx..."
                            if docker exec campushostels_nginx ls -la /var/www/campushostels-fe/index.html 2>/dev/null; then
                                echo "✅ Frontend files deployed to nginx"
                                echo "File modified: \$(docker exec campushostels_nginx stat -c %y /var/www/campushostels-fe/index.html 2>/dev/null)"
                            else
                                echo "⚠️ Frontend files not found in nginx container"
                                echo "Trying alternative nginx container name..."
                                docker ps | grep nginx
                            fi
                            
                            echo -e "\\\\n=== Django Health Check ==="
                            docker compose exec -T web python manage.py check 2>&1 | tail -5 || echo "Django check command not available"
                            
                            echo -e "\\\\n=== Service Status ==="
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            
                            echo -e "\\\\n=== Application URLs ==="
                            echo "🌐 Django Admin: https://campushostels.duckdns.org/admin/"
                            echo "🏠 Main Site: https://campushostels.duckdns.org/"
                            echo "🔧 .NET API: https://campushostels.duckdns.org/api/"
                            echo "📅 Frontend built: \$(stat -c %y \${env.FRONTEND_DIR}/dist/index.html 2>/dev/null | cut -d" " -f1,2 || echo "Unknown")"
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
            
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh """
                    echo "=== Debug Information ==="
                    ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                        cd \${env.PROJECT_DIR}
                        echo "Recent logs:"
                        docker compose logs --tail=20
                        
                        echo -e "\\\\n=== Frontend Build Debug ==="
                        echo "Checking frontend build:"
                        if [ -d "\${env.FRONTEND_DIR}/dist" ]; then
                            echo "✅ Frontend dist folder exists"
                            ls -la \${env.FRONTEND_DIR}/dist/ | head -10
                        else
                            echo "❌ No dist folder found"
                            echo "Checking frontend directory:"
                            ls -la \${env.FRONTEND_DIR}/ 2>/dev/null || echo "Cannot access frontend directory"
                        fi
                        
                        echo -e "\\\\n=== Docker Frontend Container ==="
                        docker compose logs frontend --tail=50 2>/dev/null || echo "No frontend logs"
                    '
                """
            }
        }
    }
}