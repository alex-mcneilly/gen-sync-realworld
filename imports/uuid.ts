import { ObjectId } from "npm:mongodb";

export default function uuid() {
    const obj_id = new ObjectId();
    return obj_id.toString();
}
