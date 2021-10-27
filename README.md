# Dataset of Industrial Metal Objects Labeling Tool

Iets over de tool

![Screenshot](docs/images/screenshot.png)

## Usage

Filmpje met instructies over het gebruik

## Set-up

The labeling tool consists of two parts:
* a python back-end, used for loading the dataset and performing pose calculations.
* an Angular front-end, used for user interaction and visualization.

### Back-end
* Make sure [https://docs.conda.io/en/latest/miniconda.html](conda) is installed.
* Open a terminal and navigate to the `backend` folder: `cd backend`.
* Create a new environment: `conda env create -f environment.yml`.
* Activate the environment: `conda activate dimo-labeling`.
* Start the back-end api and pass the path to the dataset folder: `python backend/api.py --path "<path-to-dataset>"`.

### Front-end
* Make sure [https://nodejs.org/en/download/](nodejs) is installed.
* Open a terminal and navigate to the `frontend` folder: `cd frontend`.
* Install the necessary node packages: `npm install`.
* Build and serve the app: `ng serve`.
* Open a browser on `http://localhost:4200/` to open the app.
