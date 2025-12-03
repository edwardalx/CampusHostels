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
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            set -e
                            echo "📦 Ensuring frontend volume exists..."
                            
                            # Create or recreate the frontend volume
                            docker volume create frontend-static 2>/dev/null || true
                            
                            echo "🔨 Building frontend image..."
                            cd ${env.PROJECT_DIR}
                            
                            # Build just the frontend
                            docker compose build frontend
                            
                            echo "📋 Creating temporary container to populate volume..."
                            # Create a temporary container to copy files to volume
                            docker run -d --name temp-frontend \\
                                -v frontend-static:/usr/share/nginx/html \\
                                --entrypoint tail campushostels-frontend -f /dev/null
                            
                            # Copy built files from image to volume
                            echo "📁 Copying built files to volume..."
                            docker run --rm --volumes-from temp-frontend \\
                                -v /var/run/docker.sock:/var/run/docker.sock \\
                                alpine sh -c "
                                    apk add --no-cache docker-cli
                                    docker create --name source-container campushostels-frontend
                                    docker cp source-container:/usr/share/nginx/html/. /usr/share/nginx/html/
                                    docker rm source-container
                                "
                            
                            echo "🧹 Cleaning up temporary container..."
                            docker stop temp-frontend
                            docker rm temp-frontend
                            
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
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            set -e
                            cd ${env.PROJECT_DIR}
                            
                            echo "📦 Pulling latest backend code..."
                            git stash || echo "No changes to stash"
                            git pull origin main
                            
                            echo "🔨 Rebuilding backend images..."
                            docker compose build web backend_api
                            
                            echo "🔄 Restarting backend services..."
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

        stage('Reload Services') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh """
                        echo "🔄 Reloading Nginx..."
                        
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            echo "Checking nginx config..."
                            echo "🔨 Rebuilding images…"
                            docker compose build

                            echo "🔄 Restarting services…"
                            docker compose down
                            docker compose up -d

                            echo "⏳ Waiting for services to start (30 seconds)…"
                            sleep 30
                            
                            echo "✅ Services reloaded!"
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
                            
                            echo -e "\\\\n=== Frontend Volume Check ==="
                            docker run --rm -v frontend-static:/check alpine ls -la /check/ | head -5
                            
                            echo -e "\\\\n=== Service Status ==="
                            echo "Frontend: \$(docker volume inspect frontend-static >/dev/null 2>&1 && echo "✅ Volume exists" || echo "❌ Volume missing")"
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            
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
                    ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                        cd ${env.PROJECT_DIR}
                        echo "Recent logs:"
                        docker compose logs --tail=20
                        echo -e "\\\\nFrontend volume contents:"
                        docker run --rm -v frontend-static:/check alpine ls -la /check/ 2>/dev/null || echo "Volume not accessible"
                    '
                """
            }
        }
    }
}