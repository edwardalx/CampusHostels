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

                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            set -e  # Exit on any error
                            echo "📦 Pulling latest repository…"
                            cd ${env.PROJECT_DIR}
                            
                            # Handle any local changes - stash them or reset
                            git stash || echo "No changes to stash"
                            git pull origin main
                            
                            # If you want to forcefully reset instead of stashing, use:
                            # git reset --hard HEAD
                            # git clean -fd
                            # git pull origin main

                            echo "🔨 Rebuilding images…"
                            docker compose build

                            echo "🔄 Restarting services…"
                            docker compose down
                            docker compose up -d

                            sleep 10  # Wait for services to start

                            echo "🗄️ Applying Django migrations…"
                            docker compose exec -T web python manage.py migrate --noinput

                            echo "📁 Collecting static files…"
                            docker compose exec -T web python manage.py collectstatic --noinput

                            echo "🔃 Restarting specific services…"
                            docker compose restart web
                            docker compose restart backend_api

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
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USERNAME}@${env.HOST_IP} '
                            echo "🌐 Checking running containers..."
                            docker compose ps

                            echo "⚡ Testing Django Admin..."
                            curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost:8000/admin || echo "Service might be on different port"

                            echo "🎯 Final URL: http://hostels.bookshelfgh.duckdns.org/admin"
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Docker deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}