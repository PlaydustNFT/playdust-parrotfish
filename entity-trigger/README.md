This module contains the code for creating triggers for different types of processors.

In order to add code for your trigger, refer to the ./src/utils.ts file, which acts
as a router for different types of entities that get written to the database.

Once the trigger type is determined, a function from ./src/trigger-writer/ folder
should be invoked to actually save the trigger.
Refer to the file ./src/trigger-writer/default.ts to see an example of trigger writer.
In short, you should create an interface that describes the data field of your trigger
in the same file as yout trigger writer.
Once the trigger writer interface is defined, instantiate a TriggerEntity object,
populate it with your data and save it to the database.

Please refer to the README at the repository root for techinical details about code layout, building, testing, etc. 