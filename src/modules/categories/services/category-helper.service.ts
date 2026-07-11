import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { Category } from '../entities/category.entity';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';
import { IsNull } from 'typeorm';

@Injectable()
export class CategoryHelperService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * Recursively builds a 3-level deep nested category tree structure.
   * Leverages sequential database queries to populate parent-child relationships up to three levels.
   */
  async buildCategoryTree(options: {
    select?: (keyof Category)[];
    isPublished?: boolean;
  }): Promise<
    Array<Category & { children: Array<Category & { children: Category[] }> }>
  > {
    const { select, isPublished } = options;

    const findOptions = (parentId: string | null) => ({
      where: {
        parentId: parentId === null ? IsNull() : parentId,
        ...(isPublished ? { status: StatusTypeEnum.PUBLISHED } : {}),
      },
      ...(select ? { select: select } : {}),
    });

    /* 1st Level: Top-level parent categories */
    const firstLevelCategories: Category[] = await this.categoryRepository.find(
      findOptions(null),
    );

    const result: Array<
      Category & { children: Array<Category & { children: Category[] }> }
    > = [];
    for (const firstLevelCategory of firstLevelCategories) {
      /* 2nd Level: Direct sub-categories */
      const secondLevelCategories: Category[] =
        await this.categoryRepository.find(findOptions(firstLevelCategory.id));

      const secondLevelCategoriesResult: Array<
        Category & { children: Category[] }
      > = [];
      for (const secondLevelCategory of secondLevelCategories) {
        /* 3rd Level: Leaf sub-categories */
        const thirdLevelCategories: Category[] =
          await this.categoryRepository.find(
            findOptions(secondLevelCategory.id),
          );

        secondLevelCategoriesResult.push({
          ...secondLevelCategory,
          children: thirdLevelCategories,
        });
      }

      result.push({
        ...firstLevelCategory,
        children: secondLevelCategoriesResult,
      });
    }

    return result;
  }
}
