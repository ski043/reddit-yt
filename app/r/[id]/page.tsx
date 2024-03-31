import { CreatePostCard } from "@/app/components/CreatePostCard";
import Pagination from "@/app/components/Pagination";
import { PostCard } from "@/app/components/PostCard";
import { SubDescriptionForm } from "@/app/components/SubDescriptionForm";
import prisma from "@/app/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Cake, FileQuestion } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

async function getData(name: string, searchParam: string) {
  noStore();
  const [count, data] = await prisma.$transaction([
    prisma.post.count({
      where: {
        subName: name,
      },
    }),

    prisma.subreddit.findUnique({
      where: {
        name: name,
      },

      select: {
        name: true,
        createdAt: true,
        description: true,
        userId: true,
        posts: {
          take: 10,
          skip: searchParam ? (Number(searchParam) - 1) * 10 : 0,

          select: {
            Comment: {
              select: {
                id: true,
              },
            },
            title: true,
            imageString: true,
            id: true,
            textContent: true,
            Vote: {
              select: {
                userId: true,
                voteType: true,
              },
            },
            User: {
              select: {
                userName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return { data, count };
}

export default async function SubRedditRoute({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page: string };
}) {
  const { data, count } = await getData(params.id, searchParams.page);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <div className="max-w-[1000px] mx-auto flex gap-x-10 mt-4 mb-10">
      <div className="w-[65%] flex flex-col gap-y-5">
        <CreatePostCard />

        {data?.posts.length === 0 ? (
          <div className="flex min-h-[300px] flex-col justify-center items-center rounded-md border border-dashed p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <FileQuestion className="h-10 w-10 text-primary" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No post have been created
            </h2>
          </div>
        ) : (
          <>
            {data?.posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                imageString={post.imageString}
                subName={data.name}
                commentAmount={post.Comment.length}
                title={post.title}
                userName={post.User?.userName as string}
                jsonContent={post.textContent}
                voteCount={post.Vote.reduce((acc, vote) => {
                  if (vote.voteType === "UP") return acc + 1;
                  if (vote.voteType === "DOWN") return acc - 1;

                  return acc;
                }, 0)}
              />
            ))}

            <Pagination totalPages={Math.ceil(count / 10)} />
          </>
        )}
      </div>

      <div className="w-[35%]">
        <Card>
          <div className="bg-muted p-4 font-semibold">About Community</div>
          <div className="p-4">
            <div className="flex items-center gap-x-3">
              <Image
                src={`https://avatar.vercel.sh/${data?.name}`}
                alt="Image of subreddit"
                width={60}
                height={60}
                className="rounded-full h-16 w-16"
              />
              <Link href={`/r/${data?.name}`} className="font-medium">
                r/{data?.name}
              </Link>
            </div>
            {user?.id === data?.userId ? (
              <SubDescriptionForm
                description={data?.description}
                subName={params.id}
              />
            ) : (
              <p className="text-sm font-normal text-secondary-foreground mt-2">
                {data?.description}
              </p>
            )}

            <div className="flex items-center gap-x-2 mt-4">
              <Cake className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground font-medium text-sm">
                Created:{" "}
                {new Date(data?.createdAt as Date).toLocaleDateString("en-us", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <Separator className="my-5" />
            <Button asChild className="rounded-full w-full">
              <Link
                href={user?.id ? `/r/${data?.name}/create` : "/api/auth/login"}
              >
                Create Post
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
