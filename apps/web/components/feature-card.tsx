import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  iconClassName?: string;
  href?: string;
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  href,
}: FeatureCardProps) => {
  const CardWrapper = href ? motion.a : motion.div;
  const wrapperProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <CardWrapper
      {...wrapperProps}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn("cursor-pointer", href && "block")}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        "group relative overflow-hidden border-border bg-background transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/5",
        className
      )}>
        <CardDecorator />
        
        <CardHeader className="pb-2">
          <div className={cn(
            "mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClassName
          )}>
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground mb-4">{description}</p>
          
          {href && (
            <div className="flex items-center text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
              <span>Learn more</span>
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </div>
          )}
        </CardContent>
        
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Card>
    </CardWrapper>
  );
};

const CardDecorator = () => (
  <>
    <span className="absolute -left-px -top-px block size-3 border-l-2 border-t-2 border-primary transition-all duration-300 group-hover:size-4" />
    <span className="absolute -right-px -top-px block size-3 border-r-2 border-t-2 border-primary transition-all duration-300 group-hover:size-4" />
    <span className="absolute -bottom-px -left-px block size-3 border-b-2 border-l-2 border-primary transition-all duration-300 group-hover:size-4" />
    <span className="absolute -bottom-px -right-px block size-3 border-b-2 border-r-2 border-primary transition-all duration-300 group-hover:size-4" />
  </>
);

// Example usage
export default function FeatureCardExample() {
  const features = [
    {
      icon: ArrowRight,
      title: "Intuitive Interface",
      description: "Our platform offers a clean, intuitive interface designed for maximum productivity and ease of use.",
      href: "#interface"
    },
    {
      icon: ArrowRight,
      title: "Advanced Analytics",
      description: "Gain valuable insights with our comprehensive analytics and reporting tools.",
      href: "#analytics"
    },
    {
      icon: ArrowRight,
      title: "Seamless Integration",
      description: "Easily integrate with your existing tools and workflows for a streamlined experience.",
      href: "#integration"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          href={feature.href}
        />
      ))}
    </div>
  );
}
