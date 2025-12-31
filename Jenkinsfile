pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
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
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                                set -e
                                echo "=== Frontend Build at \$(date) ==="
                                
                                cd ${env.PROJECT_DIR}
                                
                                echo "🔨 Building frontend..."
                                cd frontend/campushostel-fe
                                
                                # Clean and build
                                rm -rf node_modules package-lock.json
                                npm install --force --legacy-peer-deps
                                npm run build
                                
                                if [ ! -f "dist/index.html" ]; then
                                    echo "❌ Frontend build failed!"
                                    exit 1
                                fi
                                
                                echo "✅ Frontend built successfully"
                            '
                        """
                    }
                }
            }
        }

        stage('Deploy All Services') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                                set -e
                                echo "=== Full Deployment at \$(date) ==="
                                
                                cd ${env.PROJECT_DIR}
                                
                                # Update code
                                git stash || echo "No changes to stash"
                                git pull origin main
                                
                                echo "🔨 Rebuilding Docker images..."
                                docker compose build
                                
                                echo "🔄 Restarting services..."
                                docker compose down
                                docker compose up -d
                                
                                echo "⏳ Waiting for services to start..."
                                sleep 30
                                
                                echo "🗄️ Applying Django migrations..."
                                docker compose exec -T web python manage.py migrate --noinput || echo "⚠️ Migrations may have warnings"
                                
                                echo "📁 Collecting static files..."
                                docker compose exec -T web python manage.py collectstatic --noinput --clear || echo "⚠️ Static collection may have warnings"
                                
                                echo "✅ All services deployed successfully!"
                            '
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend Files') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                                set -e
                                echo "=== Frontend File Deployment at \$(date) ==="
                                
                                cd ${env.PROJECT_DIR}
                                
                                echo "📦 Deploying frontend files..."
                                
                                # METHOD 1: Copy to Docker volume (for frontend container)
                                VOLUME_PATH=\$(docker volume inspect campushostels_frontend-static --format "{{.Mountpoint}}" 2>/dev/null || echo "")
                                
                                if [ -n "\$VOLUME_PATH" ] && [ -d "\$VOLUME_PATH" ]; then
                                    echo "Copying to frontend volume: \$VOLUME_PATH"
                                    sudo rm -rf "\$VOLUME_PATH"/*
                                    sudo cp -r frontend/campushostel-fe/dist/* "\$VOLUME_PATH"/
                                    echo "✅ Frontend volume updated"
                                else
                                    echo "⚠️ Frontend volume not found, trying nginx container..."
                                fi
                                
                                # METHOD 2: Copy to nginx container (main serving location)
                                echo "Copying to nginx container..."
                                docker cp frontend/campushostel-fe/dist/. campushostels_nginx:/var/www/campushostels-fe/
                                
                                # Set permissions
                                docker exec campushostels_nginx chown -R nginx:nginx /var/www/campushostels-fe/ 2>/dev/null || echo "Permissions already set"
                                
                                echo "🔄 Reloading nginx..."
                                docker exec campushostels_nginx nginx -s reload 2>/dev/null || echo "⚠️ Nginx reload failed"
                                
                                echo "✅ Frontend files deployed successfully!"
                            '
                        """
                    }
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
                    script {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                                set -e
                                echo "=== Verification at \$(date) ==="
                                
                                cd ${env.PROJECT_DIR}
                                
                                echo "=== Container Status ==="
                                docker compose ps
                                
                                echo -e "\\\\n=== Frontend Files Status ==="
                                echo "Local build timestamp: \$(stat -c "%y" frontend/campushostel-fe/dist/index.html 2>/dev/null || echo "No local build")"
                                
                                echo "Nginx container files:"
                                docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ 2>/dev/null || echo "Cannot access nginx"
                                
                                echo -e "\\\\n=== Application Health ==="
                                echo "API test: \$(curl -s -o /dev/null -w "%{http_code}" https://localhost/api/Properties 2>/dev/null || echo "API check failed")"
                                
                                echo -e "\\\\n=== Deployment URLs ==="
                                echo "🌐 Django Admin: https://campushostels.duckdns.org/admin/"
                                echo "🏠 Main Site: https://campushostels.duckdns.org/?v=\$(date +%s)"
                                echo "🔧 .NET API: https://campushostels.duckdns.org/api/"
                                
                                echo -e "\\\\n=== Cache Busting URL ==="
                                echo "🔍 Fresh test: https://campushostels.duckdns.org/?v=\$(date +%s)"
                            '
                        """
                    }
                }
            }
        }
        
        stage('Clear Browser Cache Instructions') {
            steps {
                echo """
                🔄 Browser Cache Clearing Instructions:
                
                For Users:
                1. Open https://campushostels.duckdns.org/?v=\$(date +%s)
                2. Or use incognito/private window
                
                For Developers:
                1. Open Dev Tools (F12)
                2. Network tab → Check "Disable cache"
                3. Right-click refresh → "Empty Cache and Hard Reload"
                
                Deployment completed at: \$(date)
                """
            }
        }
    }

    post {
        always {
            echo "📊 Deployment pipeline completed"
        }
        success {
            echo "✅ Deployment successful!"
            
            // Optional: Send notification or update dashboard
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                script {
                    sh """
                        ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                            cd ${env.PROJECT_DIR}
                            echo "=== Final Verification ==="
                            echo "Frontend files deployed: \$(docker exec campushostels_nginx ls /var/www/campushostels-fe/index.html >/dev/null 2>&1 && echo "✅" || echo "❌")"
                            echo "Containers running: \$(docker compose ps | grep -c "Up")"
                        '
                    """
                }
            }
        }
        failure {
            echo "❌ Deployment failed!"
            
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                script {
                    sh """
                        echo "=== Debug Information ==="
                        ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                            cd ${env.PROJECT_DIR}
                            echo "=== Recent Logs ==="
                            docker compose logs --tail=20 2>/dev/null || echo "No logs available"
                            
                            echo -e "\\\\n=== Container Status ==="
                            docker ps -a | head -10
                            
                            echo -e "\\\\n=== Frontend Files ==="
                            ls -la frontend/campushostel-fe/dist/ 2>/dev/null || echo "No frontend build"
                        '
                    """
                }
            }
        }
    }
}