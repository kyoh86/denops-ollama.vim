#!/bin/zsh

# ファイル名の中のboilerplateを任意の文字列に置換したものにmvする
# ファイルの中のboilerplateを任意の文字列に置換したものにsedする
# 例: ./init.zsh hogehoge
# 置換後の文字列が指定されない場合はエラー
NAME="$1"
if [ -z "${NAME}" ]; then
  echo "NAME is not set";
  exit 1;
fi

find ./* -type f -not -name 'init.zsh' | while read -r file; do
  sed -i '' -e "s/boilerplate/${NAME}/g" "${file}";
done

find ./* -name '*boilerplate*' | while read -r file; do
  mv "$file" "${file//boilerplate/${NAME}}";
done

# LICENSEファイルの中の年号を今年の年号に置換する
YEAR="$(date "+%Y")"
sed -i '' -e "s/2023/${YEAR}/g" LICENSE
