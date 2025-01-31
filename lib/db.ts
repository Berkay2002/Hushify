import { collection, getDocs, query, limit, orderBy, startAfter } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function getProducts(offset: number) {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("name"), limit(5), startAfter(offset));

  const querySnapshot = await getDocs(q);
  const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const newOffset = products.length >= 5 ? offset + 5 : null;

  return {
    products,
    newOffset,
    totalProducts: products.length
  };
}