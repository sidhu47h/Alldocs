# All Docs

## Backend
 - API to generate the list of conents with sections and subsection for a given topic.
 - Calling OPENAI Sequentially for each subsection with markdown
 - Store the markdown and the list of contents in JSON format locally
 - Store to generated list of contents to mongoDB
 - Store the markdowns generated for each subsection into mongo.
 - Use S3 to store the markdown for each subsection, finalize the id of the entry for each markdown in s3.
 - Create a logic to see if a topic already exists in the mongoDB

## Frontend
 - See the list of topics
 - Upon clicking the topic it should open the table of contents in the view and a side bar to navigate through each subsection.
 - Upon clicking each subsection it should show the text in markdown of the selected subsection.