import type { Query, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { getDocs, limit, startAfter, query } from "firebase/firestore";

export async function paginateQuery(
    baseQuery: Query<DocumentData>,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
) {
    let paginatedQuery = baseQuery;
    if (lastDoc) {
        paginatedQuery = query(baseQuery, startAfter(lastDoc), limit(pageSize));
    } else {
        paginatedQuery = query(baseQuery, limit(pageSize));
    }
    const snap = await getDocs(paginatedQuery);
    return {
        docs: snap.docs,
        lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore: snap.docs.length === pageSize,
    };
}
