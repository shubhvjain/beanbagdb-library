#!/bin/bash

echo "Updating package list and installing required dependencies..."
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y docker.io nginx curl jq

echo "Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "Setting up Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "Installation complete! Docker and Nginx are ready to use."
