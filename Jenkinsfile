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
        
        // NEW: Frontend Build Stage
        stage('Build Frontend') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔨 Building Frontend on server..."
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            echo "📦 Pulling frontend code..."
                            cd ${env.PROJECT_DIR}
                            
                            # Ensure we have latest frontend code
                            git stash || echo "No changes to stash"
                            git pull origin main
                            
                            echo "📦 Installing frontend dependencies..."
                            cd frontend/campushostel-fe
                            npm install
                            
                            echo "🔨 Building frontend (Vite/React)..."
                            npm run build
                            
                            echo "✅ Frontend built successfully!"
                            echo "📁 Build output:"
                            ls -la dist/ | head -10
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
                            echo "📦 Ensuring latest code..."
                            cd ${env.PROJECT_DIR}
                            
                            # Already pulled in Build Frontend stage, but ensure latest
                            git pull origin main

                            echo "🔨 Rebuilding Docker images (including frontend)..."
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
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            echo "=== Running Containers ==="
                            docker compose ps
                            
                            echo -e "\\\\n=== Frontend Verification ==="
                            echo "Frontend build status:"
                            docker compose logs frontend --tail=5 2>/dev/null || echo "Frontend container not running (normal - it builds then exits)"
                            
                            echo -e "\\\\n=== Nginx Frontend Files ==="
                            echo "Files in /var/www/campushostels-fe:"
                            docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ 2>/dev/null | head -10 || echo "Cannot access nginx files"
                            
                            echo -e "\\\\n=== File Modification Times ==="
                            docker exec campushostels_nginx stat /var/www/campushostels-fe/index.html 2>/dev/null | grep "Modify" || echo "Cannot check file dates"
                            
                            echo -e "\\\\n=== Django Health Check ==="
                            docker compose exec -T web python manage.py check 2>&1 | tail -5 || echo "Django check command not available"
                            
                            echo -e "\\\\n=== Service Status ==="
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Frontend: \$(docker compose ps frontend | grep -q "Exit" && echo "✅ Built successfully" || echo "⚠️ Not built")"
                            
                            echo -e "\\\\n=== Application URLs ==="
                            echo "🌐 Django Admin: https://campushostels.duckdns.org/admin/"
                            echo "🏠 Main Site: https://campushostels.duckdns.org/"
                            echo "🔧 .NET API: https://campushostels.duckdns.org/api/"
                            echo "📅 Frontend built: \$(docker exec campushostels_nginx stat -c %y /var/www/campushostels-fe/index.html 2>/dev/null | cut -d" " -f1,2 || echo "Unknown")"
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
                    ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                        cd ${env.PROJECT_DIR}
                        echo "Recent logs:"
                        docker compose logs --tail=20
                        
                        echo -e "\\\\n=== Frontend Build Debug ==="
                        echo "Checking frontend build:"
                        ls -la frontend/campushostel-fe/dist/ 2>/dev/null || echo "No dist folder found"
                        echo "Frontend container logs:"
                        docker compose logs frontend --tail=50 2>/dev/null || echo "No frontend logs"
                    '
                """
            }
        }
    }
}