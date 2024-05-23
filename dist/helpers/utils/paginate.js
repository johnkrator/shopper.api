"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = void 0;
const paginate = (model, query, page, limit, sort, select, populate, keyword) => __awaiter(void 0, void 0, void 0, function* () {
    const startIndex = (page - 1) * limit;
    let filterQuery = query;
    if (keyword) {
        filterQuery = {
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { brand: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
                { category: { $regex: keyword, $options: "i" } },
                { tags: { $regex: keyword, $options: "i" } },
            ],
        };
    }
    const totalItems = yield model.countDocuments(filterQuery);
    const count = keyword ? yield model.countDocuments(filterQuery) : undefined;
    const data = yield model
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
});
exports.paginate = paginate;
//# sourceMappingURL=paginate.js.map