import time
import os
from openai import OpenAI

# Ensure the API key is set
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("Please set the OPENAI_API_KEY environment variable")

# Enter your Assistant ID here.
ASSISTANT_ID = "asst_gG5MOjxPk6juhI7FoHCTFxy7"


# Initialize the OpenAI client
client = OpenAI(api_key=api_key)

# Create a thread with a message.
thread = client.beta.threads.create(
    messages=[
        {
            "role": "user",
            # Update this with the query you want to use.
            "content": "What's the most livable city in the world?",
        }
    ]
)

# Submit the thread to the assistant (as a new run).
run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id=ASSISTANT_ID)
print(f"👉 Run Created: {run.id}")

# Wait for run to complete.
while run.status != "completed":
    run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
    print(f"🏃 Run Status: {run.status}")
    time.sleep(1)

print(f"🏁 Run Completed!")

# Get the latest message from the thread.
message_response = client.beta.threads.messages.list(thread_id=thread.id)
messages = message_response.data

# Extract the assistant's reply from the messages
for message in messages:
    if message.role == "assistant":
        assistant_reply = message.content[0].text.value
        print(f"💬 Response: {assistant_reply}")
        break
else:
    print("No response from the assistant.")
