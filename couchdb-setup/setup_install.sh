#!/bin/bash
echo "Updating package list and installing required dependencies..."
sudo apt update -y && sudo apt upgrade -y

# Install Docker
echo "Installing Docker..."
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Node.js and npm (LTS version)
echo "Installing Node.js and npm..."
sudo apt install -y nodejs npm


# Verify installations
echo "Installed versions:"
sudo usermod -aG docker $USER
docker --version
nginx -v
node -v
npm -v

echo "Installation complete! Docker, Nginx, and Node.js are ready to use."
