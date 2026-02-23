import os

from mistralai import Mistral

client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))

inputs = [
    {"role":"user","content":"Hello!"}
]

response = client.beta.conversations.start(
    agent_id="ag_019c898168c3751d90a088ccf2b213a2",
    inputs=inputs,
)

print(response)