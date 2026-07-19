# Tone Trainer

Tone Trainer is an interactive, web-based relative pitch training application designed to help users recognize musical notes and improve their relative pitch. Built with FastAPI, it offers a responsive virtual keyboard interface that maps computer keys to different musical octaves.

## Features

- **Interactive Virtual Keyboard**: Play notes across three different octaves using your computer keyboard.
- **Multiple Notation Systems**: Choose your preferred musical notation system, including:
  - C D E F G A B C
  - Do Re Mi Fa So La Ti Do
  - Sa Re Ga Ma Pa Dha Ni Sa
- **Training Mode**: Test your ear! The app plays a random note, and you must identify it by pressing the correct key. The difficulty increases as you progress, offering more note options.
- **Dark/Light Mode**: Toggle between themes for comfortable viewing.
- **Desktop/Mobile View Toggle**: Easily switch between layout modes.

## Local Deployment

To run this application locally, you will need Python installed on your machine.

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/PruthweeshaSA/ToneTrainer.git
   cd ToneTrainer
   ```

2. **Install the required dependencies**:
   It is recommended to use a virtual environment.
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --reload
   ```

4. **Access the application**:
   Open your web browser and navigate to [http://localhost:8000](http://localhost:8000).

## Docker Containerization

You can also run Tone Trainer using Docker. A `Dockerfile` is provided in the repository to easily build and containerize the application.

### Prerequisites
- Docker must be installed and running on your system.

### Build the Docker Image

To build the Docker image, run the following command in the root directory of the project:

```bash
docker build -t tonetrainer .
```

This will create a Docker image named `tonetrainer` using `python:3.12-slim` as the base image.

### Run the Docker Container

Once the image is built, you can start the container with:

```bash
docker run -p 8000:8000 tonetrainer
```

The application will now be accessible at [http://localhost:8000](http://localhost:8000).
