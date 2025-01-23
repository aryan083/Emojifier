# Base image with Python and necessary tools
FROM python:3.12

# Set the working directory in the container
WORKDIR /app

# Copy the application files to the container
COPY . /app

                                                                                        
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port for the web server
EXPOSE 7860

# Command to run the application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:7860", "app:app"]
