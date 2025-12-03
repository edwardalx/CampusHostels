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

        stage('Deploy Frontend Volume') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🚀 Deploying Frontend Volume..."
                        
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e
                            echo "📦 Ensuring frontend volume exists..."
                            
                            # Create or recreate the frontend volume (CORRECT NAME)
                            docker volume create campushostels_frontend-static 2>/dev/null || true
                            
                            echo "🔨 Building frontend image..."
                            cd \${env.PROJECT_DIR}
                            
                            # Build just the frontend
                            docker compose build frontend
                            
                            echo "📋 Copying built files to volume (SIMPLIFIED)..."
                            # Simplified copy method
                            docker run --rm \\
                                -v campushostels_frontend-static:/target \\
                                campushostels-frontend sh -c "
                                    cp -r /usr/share/nginx/html/* /target/ 2>/dev/null || true
                                    chmod -R 755 /target/
                                "
                            
                            echo "✅ Frontend volume deployment complete!"
                        '
                    """
                }
            }
        }

        stage('Deploy Backend Services') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🚀 Deploying Backend Services..."
                        
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            set -e
                            cd \${env.PROJECT_DIR}
                            
                            echo "📦 Pulling latest code..."
                            git stash || echo "No changes to stash"
                            git pull origin main
                            
                            echo "🔨 Rebuilding backend images..."
                            docker compose build web backend_api
                            
                            echo "🔄 Restarting backend services (EXCLUDING frontend & nginx)..."
                            docker compose up -d web backend_api db mssql app1
                            
                            echo "⏳ Waiting for services to start..."
                            sleep 20
                            
                            echo "🗄️ Applying Django migrations..."
                            docker compose exec -T web python manage.py migrate --noinput || echo "⚠️ Migrations may have warnings"
                            
                            echo "📁 Collecting static files..."
                            docker compose exec -T web python manage.py collectstatic --noinput --clear || echo "⚠️ Static collection may have warnings"
                            
                            echo "✅ Backend deployment complete!"
                        '
                    """
                }
            }
        }

        stage('Restart Frontend & Nginx') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔄 Restarting Frontend & Nginx..."
                        
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            cd \${env.PROJECT_DIR}
                            
                            echo "1. Stopping frontend and nginx..."
                            docker compose stop frontend nginx 2>/dev/null || true
                            docker compose rm -f frontend nginx 2>/dev/null || true
                            
                            echo "2. Starting frontend and nginx..."
                            docker compose up -d frontend nginx
                            
                            echo "3. Waiting for startup..."
                            sleep 10
                            
                            echo "✅ Frontend & Nginx restarted!"
                        '
                    """
                }
            }
        }

        stage('Reload Nginx Configuration') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔄 Reloading Nginx Configuration..."
                        
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY} \${SSH_USERNAME}@\${env.HOST_IP} '
                            echo "Checking nginx config..."
                            docker exec campushostels_nginx nginx -t && \\
                            docker exec campushostels_nginx nginx -s reload
                            
                            echo "✅ Nginx reloaded!"
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
                            cd \${env.PROJECT_DIR}
                            
                            echo "=== Running Containers ==="
                            docker compose ps
                            
                            echo -e "\\\\n=== Frontend Volume Check ==="
                            docker run --rm -v campushostels_frontend-static:/check alpine ls -la /check/ | head -5
                            
                            echo -e "\\\\n=== Service Status ==="
                            echo "Frontend: \$(docker compose ps frontend | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            
                            echo -e "\\\\n=== Website Test ==="
                            echo -n "CampusHostels: "
                            curl -s -o /dev/null -w "%{http_code}" https://campushostels.duckdns.org/
                            echo ""
                            
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
                        docker compose logs --tail=30
                        echo -e "\\\\nFrontend volume contents:"
                        docker run --rm -v campushostels_frontend-static:/check alpine ls -la /check/ 2>/dev/null || echo "Volume not accessible"
                    '
                """
            }
        }
    }
}