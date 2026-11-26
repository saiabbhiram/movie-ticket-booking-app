pipeline {
    agent any

    environment {
        DOCKER_HUB_CRED = credentials('docker-hub-credentials')
        EC2_SSH_CRED    = credentials('ec2-ssh-key')
        EC2_HOST        = 'ec2-user@YOUR_EC2_PUBLIC_IP'
        FRONTEND_IMAGE  = "${DOCKER_HUB_CRED_USR}/cinebook-frontend"
        BACKEND_IMAGE   = "${DOCKER_HUB_CRED_USR}/cinebook-backend"
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend"
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend"
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                sh 'echo "$DOCKER_HUB_CRED_PSW" | docker login -u "$DOCKER_HUB_CRED_USR" --password-stdin'
                sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${FRONTEND_IMAGE}:latest"
                sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${BACKEND_IMAGE}:latest"
                sh 'docker logout'
            }
        }

        stage('Deploy to AWS EC2') {
            steps {
                sh """
                    ssh -o StrictHostKeyChecking=no -i ${EC2_SSH_CRED} ${EC2_HOST} '
                        cd ~/cinebook &&
                        docker compose pull &&
                        docker compose up -d --remove-orphans
                    '
                """
            }
        }

        stage('Verify Deployment Health') {
            steps {
                sh """
                    ssh -o StrictHostKeyChecking=no -i ${EC2_SSH_CRED} ${EC2_HOST} '
                        sleep 10 &&
                        curl -f http://localhost:5000/api/health &&
                        curl -f http://localhost:3000/
                    '
                """
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
    }
}
