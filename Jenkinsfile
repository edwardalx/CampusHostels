pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin"
        BACKEND_ADMIN_CONTAINER = "campushostels-backend-admin-container"
        REPO_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Cleanup Previous Deployment') {
            steps {
                script {
                    echo "🧹 Cleaning up previous deployment..."
                    sh """
                        docker stop ${env.BACKEND_ADMIN_CONTAINER} || true
                        docker rm ${env.BACKEND_ADMIN_CONTAINER} || true
                        # Keep the image to speed up builds
                    """
                }
            }
        }

        stage('Checkout Code') {
            steps {
                echo "📥 Checking out latest code..."
                dir("${env.REPO_DIR}") {
                    checkout scm
                }
            }
        }

        stage('Build Backend Admin') {
            steps {
                script {
                    echo "🔨 Building Backend Admin Docker image..."
                    sh """
                        cd ${env.REPO_DIR}/backend-admin
                        docker build -t ${env.BACKEND_ADMIN_IMAGE} .
                    """
                }
            }
        }

        stage('Deploy Backend Admin') {
            steps {
                script {
                    echo "🚀 Deploying Backend Admin..."
                    sh """
                        docker run -d \
                            --name ${env.BACKEND_ADMIN_CONTAINER} \
                            -p 8081:8000 \
                            --restart unless-stopped \
                            ${env.BACKEND_ADMIN_IMAGE}
                    """
                    
                    echo "⏳ Waiting for application to start..."
                    sleep 15
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo "✅ Verifying deployment..."
                    sh """
                        echo "=== Container Status ==="
                        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep campushostels
                        
                        echo "=== Health Check ==="
                        curl -s -o /dev/null -w "Django Admin HTTP Status: %{http_code}\\n" http://localhost:8081/
                        
                        echo "=== Recent Logs ==="
                        docker logs --tail 10 ${env.BACKEND_ADMIN_CONTAINER}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 BACKEND ADMIN SUCCESSFULLY DEPLOYED!"
            echo "=========================================="
            echo "🌐 Your Django application is running at:"
            echo "   http://your-server-ip:8081"
            echo ""
            echo "🔧 Django Admin panel:"
            echo "   http://your-server-ip:8081/admin"
            echo "=========================================="
        }
        failure {
            echo "❌ Deployment failed"
            sh """
                echo "=== Debug Information ==="
                docker ps -a
                docker logs ${env.BACKEND_ADMIN_CONTAINER} || echo "Container not running"
            """
        }
    }
}