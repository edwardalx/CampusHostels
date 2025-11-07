pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin:v${BUILD_NUMBER}"
        BACKEND_ADMIN_CONTAINER = "campushostels-backend-admin-container"
        BACKEND_API_IMAGE = "campushostels-backend-api:v${BUILD_NUMBER}"
        BACKEND_API_CONTAINER = "campushostels-backend-api-container"
        REPO_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Cleanup Everything') {
            steps {
                script {
                    echo "🧹 Complete cleanup..."
                    sh """
                        # Stop and remove containers
                        docker stop ${env.BACKEND_ADMIN_CONTAINER} || true
                        docker rm ${env.BACKEND_ADMIN_CONTAINER} || true
                        docker stop ${env.BACKEND_API_CONTAINER} || true
                        docker rm ${env.BACKEND_API_CONTAINER} || true
                        docker stop backend_admin || true
                        docker rm backend_admin || true

                        # Remove ALL campushostels images
                        docker images | grep campushostels | awk '{print \$3}' | xargs docker rmi -f || true
                        
                        # Clean system
                        docker system prune -f
                    """
                }
            }
        }

        stage('Checkout Fresh Code') {
            steps {
                dir("${env.REPO_DIR}") {
                    checkout scm
                    sh '''
                        git reset --hard HEAD
                        git clean -fd
                        git pull origin main
                    '''
                }
            }
        }

        stage('Build with Version Tags') {
            steps {
                script {
                    echo "🔨 Building images with version tags..."
                    
                    sh """
                        cd ${env.REPO_DIR}/backend-admin
                        docker build -t ${env.BACKEND_ADMIN_IMAGE} .
                        # Also tag as latest for convenience
                        docker tag ${env.BACKEND_ADMIN_IMAGE} campushostels-backend-admin:latest
                    """
                    
                    sh """
                        cd ${env.REPO_DIR}/backend-api
                        docker build -t ${env.BACKEND_API_IMAGE} .
                        docker tag ${env.BACKEND_API_IMAGE} campushostels-backend-api:latest
                    """
                }
            }
        }

        stage('Verify Fresh Builds') {
            steps {
                script {
                    echo "🔍 Verifying fresh builds..."
                    sh """
                        echo "=== Current Docker Images ==="
                        docker images | grep campushostels
                        
                        echo "=== Image Sizes ==="
                        docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep campushostels
                    """
                }
            }
        }

        stage('Deploy Fresh Containers') {
            steps {
                script {
                    echo "🚀 Deploying fresh containers..."
                    
                    sh """
                        docker run -d \\
                            --name ${env.BACKEND_ADMIN_CONTAINER} \\
                            -p 8081:8000 \\
                            ${env.BACKEND_ADMIN_IMAGE}
                    """
                    
                    sh """
                        docker run -d \\
                            --name ${env.BACKEND_API_CONTAINER} \\
                            -p 8082:8000 \\
                            ${env.BACKEND_API_IMAGE}
                    """
                    
                    sleep 10
                    
                    sh """
                        echo "=== Deployment Status ==="
                        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | grep campushostels
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ FRESH DEPLOYMENT SUCCESSFUL!"
            sh """
                echo "=== Final Image List ==="
                docker images | grep campushostels
            """
        }
    }
}