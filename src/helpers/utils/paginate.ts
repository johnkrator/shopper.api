import mongoose from "mongoose";

interface PaginationResult<T> {
    data: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    count?: number;
}

const paginate = async <T>(
    model: mongoose.Model<any>,
    query: any,
    page: number,
    limit: number,
    sort?: { [key: string]: "asc" | "desc" | 1 | -1 },
    select?: string,
    populate?: any,
    keyword?: any
): Promise<PaginationResult<T>> => {
    const startIndex = (page - 1) * limit;

    let filterQuery = query;
    if (keyword) {
        filterQuery = {
            $or: [
                {name: {$regex: keyword, $options: "i"}},
                {brand: {$regex: keyword, $options: "i"}},
                {description: {$regex: keyword, $options: "i"}},
                {category: {$regex: keyword, $options: "i"}},
                {tags: {$regex: keyword, $options: "i"}},
            ],
        };
    }

    const totalItems = await model.countDocuments(filterQuery);
    const count = keyword ? await model.countDocuments(filterQuery) : undefined;

    const data = await model
        .find(filterQuery)
        .sort(sort)
        .skip(startIndex)
        .limit(limit)
        .select(select || "")
        .populate(populate);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
        data,
        currentPage: page,
        totalPages,
        totalItems,
        count,
    };
};

export {paginate};