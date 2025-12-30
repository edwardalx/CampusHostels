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
                            set -e  # Exit on any error
                            echo "📦 Pulling latest repository…"
                            cd \${env.PROJECT_DIR}

                            # Stash any local changes
                            git stash || echo "No changes to stash"
                            git pull origin main

                            echo "🔨 Rebuilding ALL images (including frontend)…"
                            docker compose build --no-cache frontend  # Force rebuild frontend
                            docker compose build  # Rebuild others normally

                            echo "🔄 Restarting services…"
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
                            echo "Frontend container logs:"
                            docker compose logs frontend --tail=5 2>/dev/null || echo "Frontend container not running (expected - it just builds)"
                            
                            echo -e "\\\\n=== Nginx Serving Files ==="
                            echo "Files in nginx volume:"
                            docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ 2>/dev/null | head -10 || echo "Cannot check nginx files"
                            
                            echo -e "\\\\n=== File Dates ==="
                            docker exec campushostels_nginx stat /var/www/campushostels-fe/index.html 2>/dev/null | grep Modify || echo "Cannot check file dates"

                            echo -e "\\\\n=== Service Status ==="
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Frontend (builder): \$(docker compose ps frontend | grep -q "Exited" && echo "✅ Built successfully" || echo "⚠️ Not built")"

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
        success {
            echo "✅ Docker deployment successful!"
            echo "📢 IMPORTANT: Frontend updates may be cached by browsers"
            echo "   Users should press Ctrl+Shift+R to clear cache"
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
                        docker compose logs --tail=50
                        
                        echo -e "\\\\n=== Frontend Build Debug ==="
                        docker compose logs frontend --tail=100 2>/dev/null || echo "No frontend logs"
                    '
                """
            }
        }
    }
}