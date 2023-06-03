provider "aws" {
  region = "us-east-1"
}

variable "image_repository_name" {
  description = "Name of the ECR repository for the Docker image"
  type        = string
  default     = "conversation_bot_tf"
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
  default     = "conversation_bot_cluster_tf"
}


data "aws_vpc" "vpc" {
  default = true
}

data "aws_subnet" "subnet_1" {
  id = "subnet-08c2ea48cfe2b0655"
}

data "aws_subnet" "subnet_2" {
  id = "subnet-0c7903fbd5fb493b1"
}

data "aws_subnet" "subnet_3" {
  id = "subnet-074d307d72825a32f"
}

data "aws_subnet" "subnet_4" {
  id = "subnet-093581f87cad0d714"
}

data "aws_subnet" "subnet_5" {
  id = "subnet-0e9534021f04d2c24"
}

data "aws_subnet" "subnet_6" {
  id = "subnet-0be7258ad0cf310ad"
}

data "aws_security_group" "load_balancer_sg" {
  id = "sg-0a369680dad5910a7"
}

resource "aws_ecr_repository" "ecr_repository" {
  name = var.image_repository_name
}

resource "aws_ecs_cluster" "ecs_cluster" {
  name = var.ecs_cluster_name
}

resource "aws_lb_target_group" "target_group" {
  name        = "convBotTargetGroupTf"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.vpc.id

  health_check {
    path     = "/health"
    interval = 30
    timeout  = 10
  }
}

resource "aws_lb" "load_balancer" {
  name               = "convBotLoadBalancerTf"
  internal           = false

  security_groups    = [data.aws_security_group.load_balancer_sg.id]
  subnets            = [
                          data.aws_subnet.subnet_1.id, 
                          data.aws_subnet.subnet_2.id,
                          data.aws_subnet.subnet_3.id,
                          data.aws_subnet.subnet_4.id,
                          data.aws_subnet.subnet_5.id,
                          data.aws_subnet.subnet_6.id,
                       ]
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_lb.load_balancer.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.target_group.arn
  }
  certificate_arn = "arn:aws:acm:us-east-1:223658162111:certificate/644805dd-7c19-4523-9b95-f2ecbd123368"
}


data "aws_ecr_authorization_token" "ecr_auth" {
  registry_id = aws_ecr_repository.ecr_repository.registry_id
}

resource "null_resource" "docker_image_push" {
  provisioner "local-exec" {
    command = <<EOT
      echo ${data.aws_ecr_authorization_token.ecr_auth.authorization_token} | base64 --decode | cut -d':' -f2 | docker login --username AWS --password-stdin ${aws_ecr_repository.ecr_repository.repository_url}
      docker build -t ${aws_ecr_repository.ecr_repository.repository_url}:latest ../
      docker push ${aws_ecr_repository.ecr_repository.repository_url}:latest
    EOT
  }
}


output "ecr_repository_url" {
  value = aws_ecr_repository.ecr_repository.repository_url
}

output "ecs_cluster_id" {
  value = aws_ecs_cluster.ecs_cluster.id
}

output "ecs_target_group_arn" {
  value = aws_lb_target_group.target_group.arn
}

output "ecs_load_balancer_sg_id" {
  value = data.aws_security_group.load_balancer_sg.id
}

output "ecs_subnet_ids" {
  value = [
            data.aws_subnet.subnet_1.id, 
            data.aws_subnet.subnet_2.id,
            data.aws_subnet.subnet_3.id,
            data.aws_subnet.subnet_4.id,
            data.aws_subnet.subnet_5.id,
            data.aws_subnet.subnet_6.id,
          ]
}

