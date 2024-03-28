import argparse
import json
import logging.config
from pathlib import Path

from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS

from dataset_loader import DatasetLoader
from dataset_saver import DatasetSaver
from pose_calculator import PoseCalculator

logging.config.fileConfig("logging.conf")

# Arguments
_parser = argparse.ArgumentParser()
_parser.add_argument("--path", type=str)
DatasetLoader.add_to_argparse(_parser)
_args = _parser.parse_args()

# Utilities
ds_loader = DatasetLoader()
ds_saver = DatasetSaver()
_path = Path(_args.path)
pose_calculator = PoseCalculator()

# Create and start Flask app
app = Flask(__name__)


@app.route("/load", methods=["POST"])
def load():
    # Load dataset
    dataset = ds_loader.load(_path, _args)
    response = jsonify(dataset)
    response.status_code = 200
    return response


@app.route("/save", methods=["POST"])
def save():
    # Save dataset
    data = json.loads(request.data)
    ds_saver.save(_path, _args, data)
    return json_response({"text": "bla2"})


@app.route("/pose", methods=["POST"])
def pose():
    # Calculate object pose
    data = json.loads(request.data)
    _pose = pose_calculator.calc_pose(
        data["points"], data["pixels"], data["cameraMatrix"]
    )
    response = jsonify(_pose.flatten(order="F").tolist())
    response.status_code = 200
    return response


@app.route("/cdn/<path:filename>")
def custom_static(filename):
    # Serve file
    return send_from_directory(_path, filename)


def json_response(payload, status=200):
    return json.dumps(payload), status, {"content-type": "application/json"}


CORS(app)

# Start app
app.run(host="0.0.0.0", port=4321)
