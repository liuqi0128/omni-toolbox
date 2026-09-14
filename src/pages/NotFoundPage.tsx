import { House, SearchAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button, EmptyState } from "@/components/ui";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<SearchAlert size={20} />}
      title="页面不存在"
      description="你访问的地址没有对应的页面，回到首页看看有哪些工具吧。"
      action={
        <Button variant="primary" icon={<House size={14} />} onClick={() => void navigate("/")}>
          返回首页
        </Button>
      }
    />
  );
}
