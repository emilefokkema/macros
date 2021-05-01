import { MessagesSource } from '../events';

export class RuntimeMessagesSource extends MessagesSource{
	constructor(runtimeMessagesEventSource){
		super();
		this.source = runtimeMessagesEventSource.map((msg, sender, sendResponse) => [msg, sendResponse]);
	}
	onMessage(listener, cancellationToken){
		return this.source.listen(listener, cancellationToken);
	}
}