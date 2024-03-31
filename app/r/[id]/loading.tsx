import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-[1000px] mx-auto flex gap-x-10 mt-4 mb-10">
      <div className="w-[65%] flex flex-col gap-y-5">
        <Skeleton className="w-full h-[1000px]" />
      </div>
      <div className="w-[35%]">
        <Skeleton className="w-full h-[300px]" />
      </div>
    </div>
  );
}
