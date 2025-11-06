pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin"
        CONTAINER_NAME = "campushostels-backend-admin-container"
        REPO_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Checkout Repository') {
            steps {
                echo "Checking out repository..."
                // Make sure Jenkins workspace is correct
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
                    echo "Stopping and removing old container if exists..."
                    sh """
                        if [ \$(docker ps -aq -f name=${env.CONTAINER_NAME}) ]; then
                            docker rm -f ${env.CONTAINER_NAME}
                        fi
                    """

                    echo "Starting new container..."
                    sh "docker run -d --name ${env.CONTAINER_NAME} -p 8000:8000 ${env.BACKEND_ADMIN_IMAGE}"
                }
            }
        }

    }

    post {
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed. Check logs for errors."
        }
    }
}
