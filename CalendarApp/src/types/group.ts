import { Tag } from "./event";
import { User } from "./user";

export interface Group {
    id: number;
    name: string;
    description?: string;
    members: User[];
    createdAt: string;
    updatedAt: string;
    admin: number;
    isPublic: boolean;
    maxMembers: number;
    groupPicture?: string;
    tags: Tag[];
}