#!/bin/bash

# 羽毛球比赛系统 - 一键部署脚本
# 作者：AI助手
# 版本：1.0

echo "🏸 羽毛球比赛系统 - 一键部署脚本"
echo "================================="
echo ""

# 检查Git是否已安装
if ! command -v git &> /dev/null; then
    echo "❌ 错误：Git未安装，请先安装Git"
    exit 1
fi

echo "📋 请选择部署平台："
echo "1. GitHub Pages（国外，需要科学上网访问）"
echo "2. Gitee Pages（国内，推荐）"
echo "3. 仅初始化Git仓库"
echo ""

read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "🚀 准备部署到GitHub Pages..."
        
        # 检查是否已经是Git仓库
        if [ ! -d ".git" ]; then
            echo "📦 初始化Git仓库..."
            git init
            git add .
            git commit -m "初始提交：羽毛球比赛系统"
        fi
        
        echo "🔗 请手动完成以下步骤："
        echo "1. 在GitHub上创建新仓库：badminton-game"
        echo "2. 运行以下命令："
        echo ""
        echo "   git remote add origin https://github.com/你的用户名/badminton-game.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
        echo ""
        echo "3. 在GitHub仓库设置中开启Pages服务"
        echo "4. 访问：https://你的用户名.github.io/badminton-game/"
        ;;
        
    2)
        echo "🚀 准备部署到Gitee Pages..."
        
        # 检查是否已经是Git仓库
        if [ ! -d ".git" ]; then
            echo "📦 初始化Git仓库..."
            git init
            git add .
            git commit -m "初始提交：羽毛球比赛系统"
        fi
        
        echo "🔗 请手动完成以下步骤："
        echo "1. 在Gitee上创建新仓库：badminton-game"
        echo "2. 运行以下命令："
        echo ""
        echo "   git remote add origin https://gitee.com/你的用户名/badminton-game.git"
        echo "   git push -u origin master"
        echo ""
        echo "3. 在Gitee仓库中开启Pages服务"
        echo "4. 访问：https://你的用户名.gitee.io/badminton-game/"
        echo ""
        echo "✨ Gitee Pages是国内最佳选择，访问速度快！"
        ;;
        
    3)
        echo "📦 初始化Git仓库..."
        
        if [ ! -d ".git" ]; then
            git init
            git add .
            git commit -m "初始提交：羽毛球比赛系统"
            echo "✅ Git仓库初始化完成！"
        else
            echo "ℹ️  Git仓库已存在"
        fi
        
        echo "📝 后续可以选择任意平台部署：GitHub、Gitee、云服务商等"
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📚 更多部署选项请查看："
echo "- gitee-deploy.md（Gitee部署详细指南）"
echo "- cloud-deploy-guide.md（云服务商部署指南）"
echo ""
echo "🎉 部署准备完成！"
