import json
import gzip
import re
import ruamel.yaml as yaml
import io
import random
from subprocess import *

from mitmproxy import ctx
from mitmproxy import flow
from mitmproxy import http

# CONFIG_LOCATION = "M:/DevEnvironment/DevWorkspace/JavaProjects/ProxyPass/target/config.yml"
PAKKIT_LOCATION = ${PAKKIT_LOCATION}
changeip = False

ownip = ${LOCAL_IP}
ownport = random.randint(1050, 6000)

class GenoaReplacement:


	def response(context, flow):

		global changeip
		global ownip
		global ownport

		if "instance" in flow.request.url:

				if flow.response.status_code == 200 and changeip == True:

					data = json.loads(flow.response.content)

					# if True: # with io.open(CONFIG_LOCATION, "r") as stream:
						# configdata = yaml.safe_load(stream)
						# ownip = ${LOCAL_IP} # configdata['proxy']['host']
						# TODO: Check if the port is free
						# ownport = random.randint(1050, 6000)

					origip = data["result"]["ipV4Address"]
					origport = data["result"]["port"]

					ctx.log.info("Replacing IP now!")
					flow.response.content = flow.response.content.replace(bytes(origip.encode("utf-8")), bytes(ownip.encode("utf-8")))
					ctx.log.info("Replacing Port now!")
					flow.response.content = flow.response.content.replace(bytes(str(origport).encode("utf-8")), bytes(str(ownport).encode("utf-8")))

					changeip = False

				elif flow.response.status_code == 200 and changeip == False:

					data = json.loads(flow.response.content)
					origip = data["result"]["ipV4Address"]
					origport = data["result"]["port"]
					"""
					with io.open(CONFIG_LOCATION, "r") as stream:
						configdata = yaml.safe_load(stream)
						configdata['destination']['host'] = str(origip)
						configdata['destination']['port'] = origport
						with io.open(CONFIG_LOCATION, "w") as writestream:
							yaml.dump(configdata, writestream)
							ctx.log.info("ProxyPass config written successfully!")
					"""

					ctx.log.info("")
					ctx.log.info("Original IP: " + str(origip))
					ctx.log.info("Original Port: " + str(origport))
					ctx.log.info("")
					ctx.log.info("Starting pakkit...")

					handle = Popen(PAKKIT_LOCATION + " --autostart --platform earth --connect " + str(origip) + " --connect-port " + str(origport) + " --listen-port " + str(ownport), stdin = PIPE, stderr = PIPE, stdout = PIPE, shell = True)

					changeip = True


addons = [
	GenoaReplacement()
]