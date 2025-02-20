export interface Stage {
	path: string;
	name: string;
	created_at: string;
	clients: string[];
}

export interface StageListItem {
	id: string;
	name: string;
	url: string;
}

export interface StageResponse {
	status: string;
	message: string;
	data: Stage[];
}
