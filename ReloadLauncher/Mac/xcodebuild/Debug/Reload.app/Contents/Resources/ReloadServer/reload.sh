
#  Copyright (C) 2012  MoSync AB

#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU Affero General Public License as
#  published by the Free Software Foundation, either version 3 of the
#  License, or (at your option) any later version.

#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU Affero General Public License for more details.

#  You should have received a copy of the GNU Affero General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

#!/bin/bash
function error_exit
{
	echo "$1" 1>&2
	exit 1
}

./bin/mac/node main.js & 
./bin/mac/node node_modules/weinre/weinre --boundHost -all- || error_exit "Could not  start weinre."
wait %1