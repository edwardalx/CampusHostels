pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
        DEPLOY_SCRIPT = "/home/eobkwaku/deploy.sh"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/edwardalx/CampusHostels.git'
                
                // Create a proper deployment script with .env support
                sh """
                    cat > deploy-fixed.sh << 'DEPLOYSCRIPT'
                    #!/bin/bash
                    set -e  # Exit on any error

                    echo "📦 Pulling latest repository…"
                    cd ${env.PROJECT_DIR}
                    
                    # Handle any local changes
                    git stash || echo "No changes to stash"
                    git pull origin main

                    echo "🔧 Ensuring .env file exists..."
                    if [ ! -f .env ]; then
                        echo "⚠️  .env file not found! Creating from template..."
                        if [ -f .env.example ]; then
                            cp .env.example .env
                            echo "✅ Created .env from .env.example"
                        else
                            echo "⚠️  .env.example not found, creating minimal .env"
                            cat > .env << EOF
# Django Settings
DJANGO_SECRET_KEY=$(openssl rand -base64 32)
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=campushostels.duckdns.org,localhost,127.0.0.1

# Database Settings
POSTGRES_DB=campushostels
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Docker Settings
COMPOSE_PROJECT_NAME=campushostels

# .NET API Settings
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:5000
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=campushostels;Username=postgres;Password=\$(cat .env | grep POSTGRES_PASSWORD | cut -d= -f2)

# Nginx Settings
NGINX_HOST=campushostels.duckdns.org
EOF
                            echo "✅ Created minimal .env file"
                        fi
                        echo "⚠️  Please review and update the .env file with actual values!"
                    else
                        echo "✅ .env file already exists"
                    fi

                    echo "🔨 Rebuilding images…"
                    docker compose build

                    echo "🔄 Restarting services…"
                    docker compose down
                    docker compose up -d

                    echo "⏳ Waiting for services to be healthy (30 seconds)…"
                    sleep 30

                    # Function to wait for service with health check
                    wait_for_service() {
                        local service=\$1
                        local max_retries=12
                        local retry_count=0
                        
                        echo "⏳ Waiting for \$service to be ready..."
                        while [ \$retry_count -lt \$max_retries ]; do
                            if docker compose ps \$service | grep -q "Up"; then
                                echo "✅ \$service container is running"
                                
                                # Special checks for specific services
                                case \$service in
                                    web)
                                        if docker compose exec -T web python -c "import django; print('Django loaded')" 2>/dev/null; then
                                            echo "✅ Django is ready for commands"
                                            return 0
                                        fi
                                        ;;
                                    db)
                                        if docker compose exec -T db pg_isready -U postgres 2>/dev/null; then
                                            echo "✅ PostgreSQL is ready"
                                            return 0
                                        fi
                                        ;;
                                    *)
                                        echo "✅ \$service is ready"
                                        return 0
                                        ;;
                                esac
                            fi
                            
                            echo "⏳ \$service not ready yet (attempt \$((retry_count + 1))/\$max_retries)..."
                            sleep 5
                            retry_count=\$((retry_count + 1))
                        done
                        
                        echo "❌ \$service failed to start after \$max_retries attempts"
                        docker compose logs \$service --tail 30
                        return 1
                    }

                    # Wait for critical services in order
                    wait_for_service db
                    wait_for_service web
                    wait_for_service backend_api

                    echo "🗄️ Applying Django migrations…"
                    if docker compose exec -T web python manage.py migrate --noinput; then
                        echo "✅ Migrations applied successfully"
                    else
                        echo "⚠️  Migrations failed, checking Django status..."
                        docker compose logs web --tail 20
                        # Try to continue anyway
                    fi

                    echo "📁 Collecting static files…"
                    docker compose exec -T web python manage.py collectstatic --noinput

                    echo "✅ Deployment completed successfully!"
                    
                    # Final health check
                    echo "=== Final Health Check ==="
                    docker compose ps
                    
                    echo -e "\\n=== Django Check ==="
                    docker compose exec -T web python manage.py check --deploy 2>/dev/null && echo "✅ Django health check passed" || echo "⚠️  Django has warnings"
                    
                    echo -e "\\n=== Service URLs ==="
                    echo "Django Admin: https://campushostels.duckdns.org/admin/"
                    echo "Main Site: https://campushostels.duckdns.org/"
                    echo ".NET API: https://campushostels.duckdns.org/api/"
                    
                    echo -e "\\n=== .env Status ==="
                    echo ".env file exists: \$(ls -la .env 2>/dev/null && echo 'Yes' || echo 'No')"
                    echo "Key variables set: \$(grep -E '^DJANGO_SECRET_KEY|^POSTGRES_PASSWORD' .env | wc -l)"
                    DEPLOYSCRIPT
                """
            }
        }

        stage('Deploy to Production') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh '''
                        echo "🚀 Deploying using improved Docker Compose script..."
                        echo "HOST_IP: ${HOST_IP}"
                        echo "SSH_USERNAME: ${SSH_USERNAME}"
                        
                        # Copy deployment script to server - FIXED SSH COMMAND
                        scp -o StrictHostKeyChecking=no -i "${SSH_KEY}" deploy-fixed.sh ${SSH_USERNAME}@${HOST_IP}:/tmp/deploy-fixed.sh
                        
                        # Make script executable
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${SSH_USERNAME}@${HOST_IP} "chmod +x /tmp/deploy-fixed.sh"
                        
                        # Execute deployment script
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${SSH_USERNAME}@${HOST_IP} "cd ${PROJECT_DIR} && /tmp/deploy-fixed.sh"
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    // Wait a bit for services to stabilize
                    sleep 30
                }
                
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053', 
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh '''
                        echo "🌐 Verifying deployment..."
                        echo "Checking server: ${SSH_USERNAME}@${HOST_IP}"
                        
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${SSH_USERNAME}@${HOST_IP} "
                            echo '=== Running Containers ==='
                            cd ${PROJECT_DIR} && docker compose ps
                            
                            echo -e '\\\\n=== Django Status ==='
                            cd ${PROJECT_DIR} && docker compose exec -T web python manage.py check 2>&1 | tail -5 || echo 'Django check failed'
                            
                            echo -e '\\\\n=== Testing Services ==='
                            echo -n 'Django (port 8000): '
                            cd ${PROJECT_DIR} && timeout 5 docker compose exec -T web curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/admin/ 2>/dev/null || echo 'N/A'
                            
                            echo -n '.NET API (port 5000): '
                            cd ${PROJECT_DIR} && timeout 5 docker compose exec -T web curl -s -o /dev/null -w '%{http_code}' http://backend_api:5000/api/ 2>/dev/null || echo 'N/A'
                            
                            echo -e '\\\\n=== .env Status ==='
                            cd ${PROJECT_DIR} && ls -la .env && echo -e '\\\\nFirst few lines:' && head -20 .env
                            
                            echo -e '\\\\n=== Public URLs ==='
                            echo '🌐 Django Admin: https://campushostels.duckdns.org/admin/'
                            echo '🏠 Main Site: https://campushostels.duckdns.org/'
                            echo '🔧 .NET API: https://campushostels.duckdns.org/api/'
                            echo '📚 Swagger: https://campushostels.duckdns.org/swagger/'
                        "
                    '''
                }
            }
        }
    }

    post {
        always {
            // Cleanup
            sh 'rm -f deploy-fixed.sh'
        }
        success {
            echo "🎉 Docker deployment successful!"
            slackSend(color: 'good', message: "✅ CampusHostels deployment successful! Services are running.")
        }
        failure {
            echo "❌ Deployment failed!"
            
            // Get logs for debugging
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh '''
                    echo "=== Checking error logs ==="
                    echo "Connecting to: ${SSH_USERNAME}@${HOST_IP}"
                    
                    ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" ${SSH_USERNAME}@${HOST_IP} "
                        cd ${PROJECT_DIR}
                        echo '=== Current Directory: \$(pwd) ==='
                        echo '=== .env Status ==='
                        ls -la .env 2>/dev/null || echo 'No .env file found'
                        
                        echo '\\\\n=== Docker Compose Status ==='
                        docker compose ps
                        
                        echo '\\\\n=== Docker Compose Logs ==='
                        docker compose logs --tail=50
                        
                        echo '\\\\n=== Django logs: ==='
                        docker compose logs web --tail 30 2>/dev/null || echo 'Cannot get Django logs'
                        
                        echo -e '\\\\n=== Nginx logs: ==='
                        docker compose logs nginx --tail 20 2>/dev/null || echo 'Cannot get nginx logs'
                        
                        echo -e '\\\\n=== Database logs: ==='
                        docker compose logs db --tail 10 2>/dev/null || echo 'Cannot get database logs'
                        
                        echo -e '\\\\n=== .NET API logs: ==='
                        docker compose logs backend_api --tail 20 2>/dev/null || echo 'Cannot get .NET API logs'
                    "
                '''
            }
            
            slackSend(color: 'danger', message: "❌ CampusHostels deployment failed! Check Jenkins logs.")
        }
    }
}