import {EntityDTO} from "../convenience";
import {EntityCategory} from "../entity-category";

export interface EntityIdentifier<Category extends EntityCategory = EntityCategory> {
  category: "EntityIdentifier";

  idCategory: Category;
  idNumber: number;
}

export function identifier<Cat extends EntityCategory>(
  idCategory: Cat,
  idNumber: number
): EntityIdentifier<Cat> {

  return ({
    category: "EntityIdentifier",

    idCategory,
    idNumber
  });
}

export function identifierFromEntity<Entity extends EntityDTO>(entity: Entity) {
  return identifier<Entity["category"]>(entity.category, entity.id);
}
