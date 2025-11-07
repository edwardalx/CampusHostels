pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin"
        CONTAINER_NAME = "campushostels-backend-admin-container"
        REPO_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
        // Use a different port than Jenkins
        DEPLOY_PORT = "8081"
    }

    stages {
        stage('Checkout Repository') {
            steps {
                echo "Checking out repository..."
                dir("${env.REPO_DIR}") {
                    checkout scm
                }
            }
        }

        stage('Build Backend Admin Docker Image') {
            steps {
                script {
                    echo "Building Backend Admin Docker image..."
                    sh "docker build -t ${env.BACKEND_ADMIN_IMAGE} ${env.REPO_DIR}/backend-admin"
                }
            }
        }

        stage('Run Backend Admin Tests') {
            steps {
                script {
                    echo "Running Django tests..."
                    sh "docker run --rm ${env.BACKEND_ADMIN_IMAGE} python manage.py test"
                }
            }
        }

        stage('Deploy Backend Admin Container') {
            steps {
                script {
                    echo "Deploying Backend Admin container on port ${env.DEPLOY_PORT}..."
                    
                    // Stop and remove old container if exists
                    sh """
                        docker stop ${env.CONTAINER_NAME} || true
                        docker rm ${env.CONTAINER_NAME} || true
                    """

                    // Run new container on different port
                    sh """
                        docker run -d \
                            --name ${env.CONTAINER_NAME} \
                            -p ${env.DEPLOY_PORT}:8000 \
                            ${env.BACKEND_ADMIN_IMAGE}
                    """
                    
                    echo "✅ Application deployed successfully!"
                    echo "🌐 Access your application at: http://your-server-ip:${env.DEPLOY_PORT}"
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Performing health check..."
                    // Wait for container to start
                    sleep 10
                    
                    // Check if container is running
                    sh "docker ps | grep ${env.CONTAINER_NAME}"
                    
                    echo "✅ Container is running successfully on port ${env.DEPLOY_PORT}"
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully!"
            echo "Backend Admin is running on port ${env.DEPLOY_PORT}"
        }
        failure {
            echo "❌ Pipeline failed. Check logs for errors."
            // Cleanup on failure
            sh """
                docker stop ${env.CONTAINER_NAME} || true
                docker rm ${env.CONTAINER_NAME} || true
            """
        }
    }
}