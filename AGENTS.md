# MessageBoard Dev
You are currently working on a multimedia social media network designed for collaboration. This social media network intends to blend the community-driven nature of forums with the flexibility of multimodal workspaces to facilitate seamless project management and brainstorming.

## Structure
Our working code will primarily live on `src/`, but some code may exist at the root level as part of backward compatibility with existing code. 

## Dev environment tips
- Use skills where possible and where meaningful. 
- Make sure to read through dependencies throughly before making use of it. Pay particular attention to custom modules. 
- Document meaningfully. Cormment on code if it helps improves its readability. 
	- Use JSDoc-style comments on declarations, making sure to describe as much of the code as possible. 
		- When it comes to input parameters, the data type written in the comment must be the preferred data type or the frequently-used one seen in existing code. Still, ensure that it does match what the code actually expects. 
	- However, documentation shouldn't be the top priority; focus on having a functioning logic and code first!  
- Check the name field inside each package's package.json to confirm the right name—skip the top-level one.
- Try to work locally, and maximize the resources as efficiently as possible. 
	- If you need to download a resource from an internet, preferrably note it down in the appropriate dependencies file, such as `package.json`. 
	- If you need to download immediately, and if there are no other alternatives, test first if you can connect to the Internet; connection isn’t guaranteed. If that doesn't work, you may ask the user to do it on your behalf, and wait until the user tells you to continue. 
- You are encouraged to evaluate alternatives when planning and to pick the most efficient method that satisfies the requirements and is compatible with existing code. 
	- Here, any advanced algorithm or technique that satisfies these conditions may be used. 
- If you have any questions that could improve the implementation, please feel free to ask. 
- Do not hallucinate. Make sure you've accounted for everything before making your response. 

### Styling tips
- On code: 
	- Parentheses: Use parentheses to group similar operations for readability if appropriate. 
	- Indentation: Use the hard tab if possible; if not, use four spaces. 
	- Strings: Use \` – or, if not, " — for a string. 
	- Blank lines: You may also use blank lines to aid in grouping. 
		- A blank line should at least appear at the end of each function or class declaration. 
	- Evaluations: 
		- Unless absolutely necessary, prefer using `==` over `===`. 
		- If there is a conditional and all that it's supposed to result in is an update in a singular value, prefer using the inline if (`(condition) ? resultIfTrue : resultIfFalse`). 
		- Inline functions are generally okay to use if appropriate, other than if both inner and outer functions are asynchronous. 
- On names: Use the PEP 8 naming style recommendations. 

## Testing instructions
- Use the appropriate skill to create, execute, and manage tests and to debug. 
- Always debug first before running tests. Fix any errors until the program seems OK. 
- Add or update tests for the code you change, even if nobody asked.
 
## PR instructions
- Title format: [<project_name>] <Title>