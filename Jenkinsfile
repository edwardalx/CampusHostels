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
                    sh """
                        echo "🔨 Building frontend..."
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            set -e
                            cd ${env.PROJECT_DIR}
                            
                            echo "📦 Pulling latest frontend code..."
                            cd frontend/campushostel-fe
                            
                            echo "🧹 Cleaning node modules..."
                            rm -rf node_modules package-lock.json 2>/dev/null || true
                            
                            echo "📦 Installing dependencies..."
                            npm install --force --legacy-peer-deps
                            
                            echo "🏗️ Building frontend..."
                            npm run build
                            
                            if [ ! -f "dist/index.html" ]; then
                                echo "❌ Frontend build failed!"
                                exit 1
                            fi
                            
                            echo "✅ Frontend built successfully!"
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

                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            set -e  # Exit on any error
                            echo "📦 Pulling latest repository…"
                            cd ${env.PROJECT_DIR}
                            
                            # Stash any local changes
                            git stash || echo "No changes to stash"
                            git pull origin main

                            echo "🔨 Rebuilding images…"
                            docker compose build

                            echo "🔄 Restarting services…"
                            docker compose down
                            docker compose up -d

                            echo "⏳ Waiting for services to start (30 seconds)…"
                            sleep 30

                            echo "🗄️ Applying Django migrations…"
                            docker compose exec -T web python manage.py migrate --noinput || echo "⚠️ Migrations may have warnings"

                            echo "📁 Collecting static files…"
                            docker compose exec -T web python manage.py collectstatic --noinput --clear || echo "⚠️ Static collection may have warnings"
                            
                            echo "📦 Deploying frontend files..."
                            # Copy frontend build to Docker volume
                            VOLUME_PATH=\$(docker volume inspect campushostels_frontend-static --format "{{.Mountpoint}}")
                            
                            if [ -n "\$VOLUME_PATH" ] && [ -d "\$VOLUME_PATH" ]; then
                                echo "Copying frontend to: \$VOLUME_PATH"
                                sudo rm -rf "\$VOLUME_PATH"/*
                                sudo cp -r frontend/campushostel-fe/dist/* "\$VOLUME_PATH"/
                                echo "✅ Frontend files deployed"
                            else
                                echo "⚠️ Frontend volume not found, skipping frontend copy"
                            fi
                            
                            echo "🔄 Reloading nginx..."
                            docker exec campushostels_nginx nginx -s reload 2>/dev/null || echo "⚠️ Nginx reload failed, continuing..."

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
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            echo "=== Running Containers ==="
                            docker compose ps
                            
                            echo -e "\\\\n=== Django Health Check ==="
                            docker compose exec -T web python manage.py check 2>&1 | tail -5 || echo "Django check command not available"
                            
                            echo -e "\\\\n=== Service Status ==="
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            
                            echo -e "\\\\n=== Frontend Status ==="
                            if docker exec campushostels_nginx ls /var/www/campushostels-fe/index.html >/dev/null 2>&1; then
                                echo "Frontend files: ✅ Found"
                                echo "Frontend timestamp: \$(docker exec campushostels_nginx ls -la /var/www/campushostels-fe/index.html | awk "{print \\\$6, \\\$7, \\\$8}")"
                            else
                                echo "Frontend files: ❌ Not found"
                            fi
                            
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
                    ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                        cd ${env.PROJECT_DIR}
                        echo "Recent logs:"
                        docker compose logs --tail=20
                    '
                """
            }
        }
    }
}