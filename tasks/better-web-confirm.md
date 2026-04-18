the way `confirm(...)` works in the ui is a bit silly. it throws an error with a huge json payload the first time it runs, then the second time it passes in pre-confirmed text.

instead we should use a websocket connection so the server can just send the `confirm` params to the client which can render, get the user's confirmation, and send the result back to the server (which might need to hold on to a generated id). orpc has websockets right?

no need for a test for this really, it's a refactor which should be convered by existing tests.